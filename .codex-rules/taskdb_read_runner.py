from __future__ import annotations

import argparse
import contextlib
import json
import logging
import os
import re
import shutil
import subprocess
import sys
import tempfile
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass
from pathlib import Path
from typing import Any


KIND_OBSERVATION = "observation"
KIND_TASK = "task"
META_ID = 0
META_FLAG = "_meta"
DEFAULT_PREFIX = "ut"
DEFAULT_MODEL = "intfloat/multilingual-e5-base"
DEFAULT_DEVICE = "cpu"
DEFAULT_HALF_LIFE_TICKS = 10
DEFAULT_OBSERVATION_SEARCH_LIMIT = 60
DEFAULT_TASK_SEARCH_LIMIT = 30
DEFAULT_OBSERVATION_FULL_LIMIT = 10
DEFAULT_TASK_FULL_LIMIT = 5
DEFAULT_CODEX_TIMEOUT_SECONDS = 120


@dataclass(frozen=True)
class Config:
    project: str
    query: str
    qdrant_url: str
    qdrant_api_key: str | None
    prefix: str
    model_name: str
    model_device: str
    half_life_ticks: int
    codex_model: str | None
    codex_timeout_seconds: int
    no_codex: bool


class RunnerError(Exception):
    pass


class UnavailableError(RunnerError):
    pass


class QdrantRestClient:
    """Минимальный read-only REST-клиент Qdrant без qdrant-client."""

    def __init__(self, base_url: str, api_key: str | None) -> None:
        self.base_url = base_url.rstrip("/")
        self.api_key = api_key
        self._opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))

    def request(
        self, method: str, path: str, body: dict[str, Any] | None = None, timeout: float = 30.0
    ) -> dict[str, Any]:
        url = self.base_url + path
        data = None
        headers = {"Accept": "application/json"}
        if self.api_key:
            headers["api-key"] = self.api_key
        if body is not None:
            data = json.dumps(body, ensure_ascii=False).encode("utf-8")
            headers["Content-Type"] = "application/json"
        req = urllib.request.Request(url, data=data, headers=headers, method=method)
        try:
            with self._opener.open(req, timeout=timeout) as resp:
                raw = resp.read().decode("utf-8")
        except urllib.error.HTTPError as exc:
            if exc.code == 404:
                raise KeyError(path) from exc
            raise UnavailableError(f"Qdrant HTTP {exc.code}: {path}") from exc
        except (urllib.error.URLError, TimeoutError, OSError) as exc:
            raise UnavailableError(f"Qdrant unavailable at {self.base_url}: {exc}") from exc
        try:
            parsed = json.loads(raw)
        except json.JSONDecodeError as exc:
            raise UnavailableError(f"Qdrant returned non-JSON response at {path}") from exc
        if parsed.get("status") not in (None, "ok"):
            raise RunnerError(f"Qdrant error at {path}: {parsed.get('status')}")
        return parsed

    def collection_exists(self, collection_name: str) -> bool:
        try:
            self.request("GET", f"/collections/{quote_path(collection_name)}", timeout=5.0)
            return True
        except KeyError:
            return False

    def retrieve(self, collection_name: str, ids: list[int]) -> list[dict[str, Any]]:
        if not ids:
            return []
        body = {"ids": ids, "with_payload": True, "with_vector": False}
        data = self.request(
            "POST", f"/collections/{quote_path(collection_name)}/points", body=body
        )
        result = data.get("result") or []
        return result if isinstance(result, list) else []

    def search(
        self, collection_name: str, vector: list[float], limit: int
    ) -> list[dict[str, Any]]:
        body = {
            "vector": vector,
            "limit": limit,
            "with_payload": ["summary", "tags", "score_tick"],
            "with_vector": False,
            "filter": {"must_not": [{"key": META_FLAG, "match": {"value": True}}]},
        }
        data = self.request(
            "POST", f"/collections/{quote_path(collection_name)}/points/search", body=body
        )
        result = data.get("result") or []
        return result if isinstance(result, list) else []


def quote_path(value: str) -> str:
    return urllib.parse.quote(value, safe="")


def emit(payload: dict[str, Any]) -> int:
    sys.stdout.write(json.dumps(payload, ensure_ascii=False, separators=(",", ":")) + "\n")
    return 0


def error_payload(status: str, project: str, warning: str) -> dict[str, Any]:
    return {
        "status": status,
        "project": project,
        "summary": [],
        "places": [],
        "used_records": [],
        "warnings": [warning],
    }


def read_input() -> dict[str, Any]:
    raw = sys.stdin.read().strip()
    if not raw:
        return {}
    try:
        data = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise RunnerError(f"stdin должен быть JSON с project и query: {exc}") from exc
    if not isinstance(data, dict):
        raise RunnerError("stdin JSON должен быть объектом")
    return data


def validate_project(project: str) -> str:
    project = project.strip()
    if not project:
        raise RunnerError("project is empty")
    if not re.fullmatch(r"[\w-]+", project, flags=re.UNICODE):
        raise RunnerError("project должен содержать только буквы, цифры, '-' и '_'")
    return project


def positive_int(value: Any, default: int) -> int:
    if value in (None, ""):
        return default
    parsed = int(value)
    if parsed <= 0:
        raise RunnerError("числовые лимиты должны быть положительными")
    return parsed


def bool_value(value: Any, default: bool = False) -> bool:
    if value in (None, ""):
        return default
    if isinstance(value, bool):
        return value
    return str(value).strip().lower() in {"1", "true", "yes", "y", "да"}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Read-only taskdb lookup through Qdrant REST + compact codex exec summary."
    )
    parser.add_argument("--project")
    parser.add_argument("--query")
    parser.add_argument("--qdrant-url")
    parser.add_argument("--qdrant-api-key")
    parser.add_argument("--prefix")
    parser.add_argument("--model")
    parser.add_argument("--device")
    parser.add_argument("--half-life-ticks", type=int)
    parser.add_argument("--codex-model")
    parser.add_argument("--codex-timeout", type=int)
    parser.add_argument("--no-codex", action="store_true")
    return parser.parse_args()


def build_config(stdin_data: dict[str, Any], args: argparse.Namespace) -> Config:
    project = args.project or stdin_data.get("project") or ""
    query = args.query or stdin_data.get("query") or ""
    project = validate_project(str(project))
    query = str(query).strip()
    if not query:
        raise RunnerError("query is empty")

    qdrant_url = (
        args.qdrant_url
        or stdin_data.get("qdrant_url")
        or os.getenv("USER_TASKS_QDRANT_URL")
        or os.getenv("QDRANT_URL")
        or ""
    )
    qdrant_api_key = (
        args.qdrant_api_key
        or stdin_data.get("qdrant_api_key")
        or os.getenv("USER_TASKS_QDRANT_API_KEY")
        or None
    )
    return Config(
        project=project,
        query=query,
        qdrant_url=str(qdrant_url).strip(),
        qdrant_api_key=str(qdrant_api_key) if qdrant_api_key else None,
        prefix=str(args.prefix or stdin_data.get("prefix") or os.getenv("USER_TASKS_QDRANT_PREFIX") or DEFAULT_PREFIX),
        model_name=str(args.model or stdin_data.get("model") or os.getenv("USER_TASKS_QDRANT_MODEL") or DEFAULT_MODEL),
        model_device=str(args.device or stdin_data.get("device") or os.getenv("USER_TASKS_QDRANT_DEVICE") or DEFAULT_DEVICE),
        half_life_ticks=positive_int(
            args.half_life_ticks
            or stdin_data.get("half_life_ticks")
            or os.getenv("USER_TASKS_QDRANT_HALF_LIFE_TICKS"),
            DEFAULT_HALF_LIFE_TICKS,
        ),
        codex_model=args.codex_model
        or stdin_data.get("codex_model")
        or os.getenv("TASKDB_READ_CODEX_MODEL")
        or None,
        codex_timeout_seconds=positive_int(
            args.codex_timeout
            or stdin_data.get("codex_timeout_seconds")
            or os.getenv("TASKDB_READ_CODEX_TIMEOUT"),
            DEFAULT_CODEX_TIMEOUT_SECONDS,
        ),
        no_codex=args.no_codex or bool_value(stdin_data.get("no_codex"), False),
    )


def candidate_urls(configured_url: str) -> list[str]:
    urls: list[str] = []
    for url in (
        configured_url,
        "http://127.0.0.1:7333",
        "http://localhost:7333",
        "http://127.0.0.1:6333",
        "http://localhost:6333",
    ):
        clean = str(url or "").strip().rstrip("/")
        if clean and clean not in urls:
            urls.append(clean)
    return urls


def connect_qdrant(cfg: Config) -> QdrantRestClient:
    last_error = ""
    for url in candidate_urls(cfg.qdrant_url):
        client = QdrantRestClient(url, cfg.qdrant_api_key)
        try:
            client.request("GET", "/collections", timeout=3.0)
            return client
        except UnavailableError as exc:
            last_error = str(exc)
    raise UnavailableError(last_error or "Qdrant REST endpoint not found")


def collection_name(cfg: Config, kind: str) -> str:
    return f"{cfg.prefix}__{kind}__{cfg.project}"


def suppress_model_noise() -> None:
    os.environ.setdefault("TRANSFORMERS_VERBOSITY", "error")
    os.environ.setdefault("HF_HUB_DISABLE_PROGRESS_BARS", "1")
    os.environ.setdefault("TOKENIZERS_PARALLELISM", "false")
    logging.getLogger().setLevel(logging.ERROR)
    for name in ("sentence_transformers", "transformers", "huggingface_hub"):
        logging.getLogger(name).setLevel(logging.ERROR)


def embed_query(cfg: Config) -> list[float]:
    suppress_model_noise()
    devnull = Path(os.devnull)
    try:
        with devnull.open("w", encoding="utf-8") as sink:
            with contextlib.redirect_stdout(sink), contextlib.redirect_stderr(sink):
                from sentence_transformers import SentenceTransformer

                local_only = bool_value(os.getenv("USER_TASKS_QDRANT_LOCAL_FILES_ONLY"), True)
                model = SentenceTransformer(
                    cfg.model_name,
                    device=cfg.model_device,
                    local_files_only=local_only,
                )
                vec = model.encode(
                    f"query: {cfg.query}",
                    normalize_embeddings=True,
                    convert_to_numpy=True,
                )
        return vec.tolist()
    except Exception as exc:
        raise RunnerError(f"embedding failed: {exc}") from exc


def read_project_tick(client: QdrantRestClient, cfg: Config) -> int:
    tick = 1
    for kind in (KIND_OBSERVATION, KIND_TASK):
        name = collection_name(cfg, kind)
        if not client.collection_exists(name):
            continue
        for point in client.retrieve(name, [META_ID]):
            payload = point.get("payload") or {}
            raw_tick = payload.get("project_tick")
            if isinstance(raw_tick, int) and raw_tick > tick:
                tick = raw_tick
    return tick


def freshness(current_tick: int, score_tick: int, half_life_ticks: int) -> float:
    age_ticks = max(0, current_tick - score_tick)
    return 1 / (1 + age_ticks / half_life_ticks)


def score_tick(payload: dict[str, Any]) -> int:
    raw = payload.get("score_tick", 0)
    return raw if isinstance(raw, int) and raw >= 0 else 0


def search_kind(
    client: QdrantRestClient,
    cfg: Config,
    kind: str,
    vector: list[float],
    limit: int,
    current_tick: int,
) -> list[dict[str, Any]]:
    name = collection_name(cfg, kind)
    if not client.collection_exists(name):
        return []
    hits = client.search(name, vector, limit)
    out: list[dict[str, Any]] = []
    for hit in hits:
        payload = hit.get("payload") or {}
        semantic_score = float(hit.get("score") or 0.0)
        tick = score_tick(payload)
        fresh = freshness(current_tick, tick, cfg.half_life_ticks)
        out.append(
            {
                "kind": kind,
                "id": hit.get("id"),
                "summary": str(payload.get("summary") or ""),
                "tags": payload.get("tags") if isinstance(payload.get("tags"), list) else [],
                "score": semantic_score,
                "score_tick": tick,
                "freshness": fresh,
                "final_score": max(semantic_score, 0.0) * fresh,
            }
        )
    out.sort(key=lambda item: item["final_score"], reverse=True)
    return out


def retrieve_full(
    client: QdrantRestClient, cfg: Config, kind: str, previews: list[dict[str, Any]], limit: int
) -> list[dict[str, Any]]:
    selected = [item for item in previews if isinstance(item.get("id"), int)][:limit]
    if not selected:
        return []
    by_id = {int(item["id"]): item for item in selected}
    points = client.retrieve(collection_name(cfg, kind), list(by_id))
    records: list[dict[str, Any]] = []
    for point in points:
        point_id = point.get("id")
        if not isinstance(point_id, int) or point_id not in by_id:
            continue
        payload = point.get("payload") or {}
        preview = by_id[point_id]
        records.append(
            {
                "kind": kind,
                "id": point_id,
                "summary": str(payload.get("summary") or preview.get("summary") or ""),
                "body": compact_text(str(payload.get("body") or ""), 3500),
                "tags": payload.get("tags") if isinstance(payload.get("tags"), list) else [],
                "affected": normalize_affected(payload.get("affected")),
                "score": preview.get("score"),
                "score_tick": preview.get("score_tick"),
                "freshness": preview.get("freshness"),
                "final_score": preview.get("final_score"),
            }
        )
    records.sort(key=lambda item: float(item.get("final_score") or 0.0), reverse=True)
    return records


def normalize_affected(value: Any) -> list[dict[str, Any]]:
    if not isinstance(value, list):
        return []
    out: list[dict[str, Any]] = []
    for item in value:
        if not isinstance(item, dict):
            continue
        clean = {key: item[key] for key in ("path", "symbol", "line") if key in item}
        if clean:
            out.append(clean)
    return out[:8]


def compact_text(value: str, limit: int) -> str:
    value = re.sub(r"\s+", " ", value).strip()
    if len(value) <= limit:
        return value
    return value[: limit - 1].rstrip() + "…"


def fetch_records(client: QdrantRestClient, cfg: Config) -> list[dict[str, Any]]:
    vector = embed_query(cfg)
    current_tick = read_project_tick(client, cfg)
    observations = search_kind(
        client,
        cfg,
        KIND_OBSERVATION,
        vector,
        DEFAULT_OBSERVATION_SEARCH_LIMIT,
        current_tick,
    )
    tasks = search_kind(
        client,
        cfg,
        KIND_TASK,
        vector,
        DEFAULT_TASK_SEARCH_LIMIT,
        current_tick,
    )
    full_observations = retrieve_full(
        client, cfg, KIND_OBSERVATION, observations, DEFAULT_OBSERVATION_FULL_LIMIT
    )
    full_tasks = retrieve_full(client, cfg, KIND_TASK, tasks, DEFAULT_TASK_FULL_LIMIT)
    return full_observations + full_tasks


def write_schema(path: Path) -> None:
    schema = {
        "type": "object",
        "additionalProperties": False,
        "required": ["status", "project", "summary", "places", "used_records", "warnings"],
        "properties": {
            "status": {"type": "string", "enum": ["ok", "empty"]},
            "project": {"type": "string"},
            "summary": {"type": "array", "items": {"type": "string"}, "maxItems": 10},
            "places": {"type": "array", "items": {"type": "string"}, "maxItems": 20},
            "used_records": {
                "type": "array",
                "items": {
                    "type": "object",
                    "additionalProperties": False,
                    "required": ["kind", "id"],
                    "properties": {
                        "kind": {"type": "string", "enum": [KIND_OBSERVATION, KIND_TASK]},
                        "id": {"type": "integer"},
                    },
                },
                "maxItems": 15,
            },
            "warnings": {"type": "array", "items": {"type": "string"}, "maxItems": 5},
        },
    }
    path.write_text(json.dumps(schema, ensure_ascii=False), encoding="utf-8")


def build_prompt(cfg: Config, records: list[dict[str, Any]]) -> str:
    payload = {
        "project": cfg.project,
        "query": cfg.query,
        "records": records,
    }
    return (
        "Ты компактный read-only summarizer для taskdb. Код, файлы, AGENTS.md, "
        "интернет и MCP tools не открывай. Используй только JSON ниже.\n\n"
        "Верни только JSON по schema. Нужны короткие практичные факты для главного "
        "агента перед чтением кода.\n\n"
        "Правила:\n"
        "- status=ok, если есть реально полезный контекст; иначе status=empty.\n"
        "- summary: 3-10 плотных пунктов без id, score, tags и цитат.\n"
        "- places: файлы, классы, методы, endpoint или термины из affected/body, "
        "которые стоит проверить после lookup.\n"
        "- used_records: только kind/id записей, чьи факты попали в summary или places.\n"
        "- warnings: только существенные оговорки о слабой релевантности или stale.\n"
        "- Не пересказывай весь body и не добавляй сведения, которых нет в records.\n\n"
        "INPUT_JSON:\n"
        f"{json.dumps(payload, ensure_ascii=False)}"
    )


def run_codex(cfg: Config, records: list[dict[str, Any]]) -> dict[str, Any]:
    with tempfile.TemporaryDirectory(prefix="taskdb-read-") as tmp:
        tmp_path = Path(tmp)
        schema_path = tmp_path / "schema.json"
        output_path = tmp_path / "last_message.json"
        write_schema(schema_path)
        codex_exe = find_codex_executable()
        cmd = [
            codex_exe,
            "exec",
            "--ephemeral",
            "--ignore-rules",
            "--skip-git-repo-check",
            "-C",
            str(tmp_path),
            "--output-schema",
            str(schema_path),
            "-o",
            str(output_path),
            "-",
        ]
        if cfg.codex_model:
            cmd[2:2] = ["-m", cfg.codex_model]
        env = os.environ.copy()
        env.setdefault("PYTHONIOENCODING", "utf-8")
        prompt = build_prompt(cfg, records)
        try:
            subprocess.run(
                cmd,
                input=prompt,
                text=True,
                encoding="utf-8",
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                check=True,
                timeout=cfg.codex_timeout_seconds,
                env=env,
            )
        except (subprocess.SubprocessError, OSError) as exc:
            raise RunnerError(f"codex exec failed: {exc}") from exc
        if not output_path.exists():
            raise RunnerError("codex exec did not write output")
        raw = output_path.read_text(encoding="utf-8").strip()
    return parse_json_object(raw)


def find_codex_executable() -> str:
    """На Windows выбирает запускаемый wrapper, а не npm shim без расширения."""
    candidates = ["codex.cmd", "codex.exe", "codex"] if os.name == "nt" else ["codex"]
    for candidate in candidates:
        resolved = shutil.which(candidate)
        if resolved:
            return resolved
    raise RunnerError("codex executable not found in PATH")


def parse_json_object(raw: str) -> dict[str, Any]:
    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", raw, flags=re.S)
        if not match:
            raise RunnerError("codex output is not JSON")
        parsed = json.loads(match.group(0))
    if not isinstance(parsed, dict):
        raise RunnerError("codex output JSON must be object")
    return parsed


def normalize_result(cfg: Config, result: dict[str, Any], records: list[dict[str, Any]]) -> dict[str, Any]:
    allowed = {(record["kind"], record["id"]) for record in records}
    status = result.get("status")
    if status not in {"ok", "empty"}:
        status = "ok" if records else "empty"
    summary = [str(item).strip() for item in result.get("summary", []) if str(item).strip()]
    places = [str(item).strip() for item in result.get("places", []) if str(item).strip()]
    warnings = [str(item).strip() for item in result.get("warnings", []) if str(item).strip()]
    used_records = []
    for item in result.get("used_records", []):
        if not isinstance(item, dict):
            continue
        kind = item.get("kind")
        point_id = item.get("id")
        if (kind, point_id) in allowed:
            used_records.append({"kind": kind, "id": point_id})
    if status == "ok" and not summary:
        return fallback_result(cfg, records, ["codex exec вернул пустую выжимку"])
    return {
        "status": status,
        "project": cfg.project,
        "summary": summary[:10],
        "places": dedupe(places)[:20],
        "used_records": dedupe_records(used_records)[:15],
        "warnings": warnings[:5],
    }


def fallback_result(
    cfg: Config, records: list[dict[str, Any]], extra_warnings: list[str] | None = None
) -> dict[str, Any]:
    if not records:
        return {
            "status": "empty",
            "project": cfg.project,
            "summary": [],
            "places": [],
            "used_records": [],
            "warnings": list(extra_warnings or []),
        }
    top = sorted(records, key=lambda item: float(item.get("final_score") or 0.0), reverse=True)[:8]
    summary = [str(item.get("summary") or "").strip() for item in top]
    places: list[str] = []
    for item in top:
        for affected in item.get("affected") or []:
            path = affected.get("path")
            symbol = affected.get("symbol")
            if path and symbol:
                places.append(f"{path} :: {symbol}")
            elif path:
                places.append(str(path))
            elif symbol:
                places.append(str(symbol))
    return {
        "status": "ok",
        "project": cfg.project,
        "summary": [item for item in summary if item][:10],
        "places": dedupe(places)[:20],
        "used_records": [{"kind": item["kind"], "id": item["id"]} for item in top],
        "warnings": list(extra_warnings or []),
    }


def dedupe(values: list[str]) -> list[str]:
    seen: set[str] = set()
    out: list[str] = []
    for value in values:
        if value in seen:
            continue
        seen.add(value)
        out.append(value)
    return out


def dedupe_records(records: list[dict[str, Any]]) -> list[dict[str, Any]]:
    seen: set[tuple[str, int]] = set()
    out: list[dict[str, Any]] = []
    for record in records:
        key = (record["kind"], record["id"])
        if key in seen:
            continue
        seen.add(key)
        out.append(record)
    return out


def run() -> int:
    args = parse_args()
    try:
        cfg = build_config(read_input(), args)
        client = connect_qdrant(cfg)
        records = fetch_records(client, cfg)
        if not records:
            return emit(fallback_result(cfg, []))
        if cfg.no_codex:
            return emit(fallback_result(cfg, records))
        try:
            return emit(normalize_result(cfg, run_codex(cfg, records), records))
        except RunnerError as exc:
            return emit(fallback_result(cfg, records, [str(exc)]))
    except UnavailableError as exc:
        project = getattr(locals().get("cfg", None), "project", "")
        return emit(error_payload("unavailable", project, str(exc)))
    except Exception as exc:
        project = getattr(locals().get("cfg", None), "project", "")
        return emit(error_payload("error", project, str(exc)))


if __name__ == "__main__":
    raise SystemExit(run())
