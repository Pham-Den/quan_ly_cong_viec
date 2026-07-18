#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Tao Defect issue tren Jira FDP voi day du thong tin chuan QC:
  test data (data that), steps, actual/expected, severity, priority, platform,
  environment found, quality activity, anh dinh kem, va tu dong link toi US.

Custom fields FDP Defect:
  customfield_10082  Severity          : Critical | Major | Normal | Minor
  customfield_10100  Environment found : DEV | QC | UAT | PILOT | SANDBOX | PRODUCTION
  customfield_10202  Quality Activity  : Functional Test | User Acceptance test |
                                         Regression Test | System Integration test |
                                         Unit test | Review | Security Test | Final inspection
  customfield_11021  Platform          : APP | BE | FE | External | Other
  customfield_10205  Defect Type       : Code defect | Design defect | Document defect | System defect

Severity -> Jira mapping:
  S1 -> Severity=Critical, Priority=Highest
  S2 -> Severity=Major,    Priority=High
  S3 -> Severity=Normal,   Priority=Medium  (default)
  S4 -> Severity=Minor,    Priority=Low

US linking (sau khi tao issue):
  --us-id FDP-827  -> tu dong tao issue link "Relates to" Defect -> US
  Neu khong truyen, script tu extract [FDP-XXX] dau tien trong --summary.

Usage:
  python tools/jira_create_bug.py \\
    --summary "[FDP-827][AGENT_16] Thieu X-Agent-ID tra ve RAG_MISSING_CALLER_IDENTITY" \\
    --us-id FDP-827 \\
    --tc-id AGENT_16 \\
    --run-id "12/06-R1" \\
    --env-url "https://aip-portal-qc.ops.onenexus.dev" \\
    --env-user "dev / workspace 019ea682-..." \\
    --precondition "KB ID: 4f331435-c81e-4ec7-a29f-efcac7adf998 ton tai tren QC" \\
    --steps "1. POST .../agentic-search\\n2. Bo header X-Agent-ID\\n3. Body: {query:test}" \\
    --actual "HTTP 400 — RAG_MISSING_CALLER_IDENTITY" \\
    --expected "HTTP 400 — RAG_MISSING_AGENT" \\
    --severity S3 \\
    --platform BE \\
    --env-found QC \\
    --quality-activity "Functional Test" \\
    --assigned TBD
"""
import argparse
import re
import sys
from pathlib import Path

import requests

sys.path.insert(0, str(Path(__file__).parent))
from credentials import load_atlassian_credentials

APPLICATION_JSON = "application/json"

# ---------- Severity / Priority mappings ----------

SEVERITY_TO_JIRA_SEVERITY = {
    "S1": "Critical",
    "S2": "Major",
    "S3": "Normal",
    "S4": "Minor",
}

SEVERITY_TO_JIRA_PRIORITY = {
    "S1": "Highest",
    "S2": "High",
    "S3": "Medium",
    "S4": "Low",
}

PRIORITY_TO_JIRA = {
    "P1": "Highest",
    "P2": "High",
    "P3": "Medium",
    "P4": "Low",
}


# ---------- Custom field IDs (FDP project) ----------

CF_SEVERITY          = "customfield_10082"   # Critical | Major | Normal | Minor
CF_ENV_FOUND         = "customfield_10100"   # DEV | QC | UAT | PILOT | SANDBOX | PRODUCTION
CF_QUALITY_ACTIVITY  = "customfield_10202"   # Functional Test | UAT | Regression Test | ...
CF_PLATFORM          = "customfield_11021"   # APP | BE | FE | External | Other
CF_DEFECT_TYPE       = "customfield_10205"   # Code defect | Design defect | ...
CF_SPRINT            = "customfield_10018"   # Sprint (int ID)

# Scrum board IDs cho FDP project (thu tu uu tien: AI Sprint Dev > FDP_Scrum)
FDP_SCRUM_BOARD_IDS  = [10707, 10710]


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def parse_args():
    p = argparse.ArgumentParser(
        description="Tao Defect issue tren Jira FDP voi day du thong tin QC.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    p.add_argument("--project", default="FDP",
                   help="Project key (default: FDP)")
    p.add_argument("--summary", required=True,
                   help="Tieu de bug -- format: [TC-ID] Mo ta loi")
    p.add_argument("--tc-id", default=None,
                   help="Test case / ticket lien quan (vi du: FDP-591)")

    # Test environment
    p.add_argument("--env-url", default=None,
                   help="URL moi truong test")
    p.add_argument("--env-user", default=None,
                   help="Tai khoan test")
    p.add_argument("--env-pass", default=None,
                   help="Mat khau test (chi dung test account)")
    p.add_argument("--env-branch", default=None,
                   help="Branch / build / version (vi du: develop, v1.2.3)")

    # Test steps
    p.add_argument("--precondition", default=None,
                   help="Dieu kien tien quyet")
    p.add_argument("--steps", required=True,
                   help="Steps to reproduce (dung \\\\n de xuong dong)")
    p.add_argument("--actual", required=True,
                   help="Ket qua thuc te (actual result)")
    p.add_argument("--expected", required=True,
                   help="Ket qua mong muon (expected result)")

    # Severity / priority
    p.add_argument("--severity", default="S3",
                   choices=["S1", "S2", "S3", "S4"],
                   help="Severity: S1=Critical, S2=Major, S3=Normal, S4=Minor (default: S3)")
    p.add_argument("--priority", default=None,
                   choices=["P1", "P2", "P3", "P4"],
                   help="Priority override (mac dinh tu dong map tu --severity)")

    # Jira Defect custom fields
    p.add_argument("--platform", default="FE",
                   choices=["APP", "BE", "FE", "External", "Other"],
                   help="Platform (default: FE)")
    p.add_argument("--env-found", default="QC",
                   choices=["DEV", "QC", "UAT", "PILOT", "SANDBOX", "PRODUCTION"],
                   help="Environment found (default: QC)")
    p.add_argument("--quality-activity", default="Functional Test",
                   choices=["Functional Test", "User Acceptance test", "Regression Test",
                            "System Integration test", "Unit test", "Review",
                            "Security Test", "Final inspection"],
                   help="Quality Activity (default: Functional Test)")
    p.add_argument("--defect-type", default="Code defect",
                   choices=["Code defect", "Design defect", "Document defect", "System defect"],
                   help="Defect Type (default: Code defect)")
    # Tracking fields (defect.schema.yaml v2.0)
    p.add_argument("--run-id", default=None,
                   help="Run ID phat hien bug, pattern DD/MM-R# (vi du: 12/06-R1)")
    p.add_argument("--assigned", default=None,
                   help="Ten dev duoc giao fix (hoac TBD)")

    # Sprint
    p.add_argument("--sprint", default=None,
                   help="Sprint ID (so nguyen). Neu khong truyen, tu dong tim sprint "
                        "active tren FDP_Scrum Board. Truyen 0 de bo sprint.")

    # US / Parent linking
    p.add_argument("--us-id", default=None,
                   help="Jira Story/US key de tu dong link 'Relates to' sau khi tao. "
                        "Neu khong truyen, tu extract [FDP-XXX] dau tien trong --summary.")
    p.add_argument("--parent", default=None,
                   help="Parent issue key (Epic hoac Story) de set trong payload Jira.")

    p.add_argument("--labels", nargs="*", default=[],
                   help="Labels bo sung (space-separated)")
    p.add_argument("--assignee", default=None,
                   help="Assignee accountId (de assign tren Jira)")
    p.add_argument("--attachments", nargs="*", default=[],
                   help="Duong dan file anh / log dinh kem (space-separated)")
    return p.parse_args()


# ---------------------------------------------------------------------------
# ADF helpers
# ---------------------------------------------------------------------------

def _text(text):
    return {"type": "text", "text": text}


def _heading(text, level=3):
    return {"type": "heading", "attrs": {"level": level}, "content": [_text(text)]}


def _paragraph(*nodes):
    return {"type": "paragraph", "content": list(nodes)}


def _bullet_list(items):
    return {
        "type": "bulletList",
        "content": [
            {"type": "listItem", "content": [_paragraph(_text(item))]}
            for item in items
        ],
    }


def _ordered_list(items):
    return {
        "type": "orderedList",
        "content": [
            {"type": "listItem", "content": [_paragraph(_text(item))]}
            for item in items
        ],
    }


def _rule():
    return {"type": "rule"}


def _split_lines(text):
    return [l.strip() for l in text.replace("\\n", "\n").splitlines() if l.strip()]


def _strip_leading_number(text):
    return re.sub(r"^\d+[\.\)]\s*", "", text)


def build_adf(args):
    content = []

    # -- Test Environment --
    content.append(_heading("Test Environment", level=3))
    env_items = []
    if args.env_url:
        env_items.append("URL: " + args.env_url)
    if args.env_user:
        env_items.append("User: " + args.env_user)
    if args.env_pass:
        env_items.append("Password: " + args.env_pass)
    if args.env_branch:
        env_items.append("Branch / Build: " + args.env_branch)
    if args.tc_id:
        env_items.append("Test Case: " + args.tc_id)
    env_items.append("Severity: " + SEVERITY_TO_JIRA_SEVERITY.get(args.severity, args.severity)
                     + " | Priority: " + (PRIORITY_TO_JIRA.get(args.priority) if args.priority
                                          else SEVERITY_TO_JIRA_PRIORITY.get(args.severity, "Medium"))
                     + " | Platform: " + args.platform
                     + " | Env Found: " + args.env_found)
    env_items.append("Quality Activity: " + args.quality_activity)
    if args.run_id:
        env_items.append("Run ID phat hien: " + args.run_id)
    if args.assigned:
        env_items.append("Assigned to: " + args.assigned)
    if args.us_id:
        env_items.append("US lien quan: " + args.us_id)
    content.append(_bullet_list(env_items))
    content.append(_rule())

    # -- Precondition --
    if args.precondition:
        content.append(_heading("Precondition", level=3))
        lines = _split_lines(args.precondition)
        content.append(_bullet_list(lines) if len(lines) > 1 else _paragraph(_text(args.precondition.strip())))
        content.append(_rule())

    # -- Steps to Reproduce --
    content.append(_heading("Steps to Reproduce", level=3))
    steps = [_strip_leading_number(s) for s in _split_lines(args.steps)]
    content.append(_ordered_list(steps) if steps else _paragraph(_text(args.steps.strip())))
    content.append(_rule())

    # -- Actual Result --
    content.append(_heading("Actual Result", level=3))
    actual_lines = _split_lines(args.actual)
    content.append(_bullet_list(actual_lines) if len(actual_lines) > 1 else _paragraph(_text(args.actual.strip())))
    content.append(_rule())

    # -- Expected Result --
    content.append(_heading("Expected Result", level=3))
    expected_lines = _split_lines(args.expected)
    content.append(_bullet_list(expected_lines) if len(expected_lines) > 1 else _paragraph(_text(args.expected.strip())))

    return {"type": "doc", "version": 1, "content": content}


# ---------------------------------------------------------------------------
# Jira API helpers
# ---------------------------------------------------------------------------

def _get_allowed_value_id(auth, base_url, field_id, value_name, project_key="FDP"):
    """Tra ve id cua 1 allowed value trong custom field (select type)."""
    url = (base_url + "/rest/api/3/issue/createmeta/FDP/issuetypes")
    resp = requests.get(url, auth=auth, headers={"Accept": APPLICATION_JSON}, timeout=30)
    types = resp.json().get("issueTypes", [])
    defect = next((t for t in types if t["name"].lower() == "defect"), None)
    if not defect:
        return None
    resp2 = requests.get(
        base_url + "/rest/api/3/issue/createmeta/FDP/issuetypes/" + defect["id"],
        auth=auth, headers={"Accept": APPLICATION_JSON}, timeout=30)
    fields = resp2.json()
    if isinstance(fields, list):
        fmeta = next((f for f in fields if f.get("fieldId") == field_id), None)
    else:
        fmeta = fields.get("fields", {}).get(field_id)
    if not fmeta:
        return None
    allowed = fmeta.get("allowedValues", [])
    match = next(
        (v for v in allowed if (v.get("name") or v.get("value", "")).lower() == value_name.lower()),
        None,
    )
    return match.get("id") if match else None


def _select_field(value_name):
    """Single-select field (radio button)."""
    return {"value": value_name}


def _multi_select_field(value_name):
    """Multi-select / checkbox field — Jira yeu cau array."""
    return [{"value": value_name}]


def find_defect_issue_type_id(auth, base_url, project_key):
    preferred = ["defect", "bug"]

    def _pick(types):
        for name in preferred:
            match = next((t for t in types if t["name"].lower() == name and not t.get("subtask")), None)
            if match:
                return match
        return next((t for t in types if not t.get("subtask")), None)

    url = base_url + "/rest/api/3/issue/createmeta/" + project_key + "/issuetypes"
    resp = requests.get(url, auth=auth, headers={"Accept": APPLICATION_JSON}, timeout=60)
    if resp.ok:
        found = _pick(resp.json().get("issueTypes", []))
        if found:
            return found["id"]

    url = base_url + "/rest/api/3/issue/createmeta"
    resp = requests.get(
        url, auth=auth, headers={"Accept": APPLICATION_JSON},
        params={"projectKeys": project_key, "expand": "projects.issuetypes"},
        timeout=60,
    )
    if resp.ok:
        projects = resp.json().get("projects", [])
        if projects:
            found = _pick(projects[0].get("issuetypes", []))
            if found:
                return found["id"]

    url = base_url + "/rest/api/3/issuetype"
    resp = requests.get(url, auth=auth, headers={"Accept": APPLICATION_JSON}, timeout=60)
    resp.raise_for_status()
    found = _pick(resp.json())
    if not found:
        raise RuntimeError("Khong tim thay issueType 'Defect' hoac 'Bug' tren Jira nay!")
    return found["id"]


def find_priority_id(auth, base_url, priority_name):
    url = base_url + "/rest/api/3/priority"
    resp = requests.get(url, auth=auth, headers={"Accept": APPLICATION_JSON}, timeout=60)
    if not resp.ok:
        return None
    match = next((p for p in resp.json() if p["name"].lower() == priority_name.lower()), None)
    return match["id"] if match else None


def create_issue(auth, base_url, payload):
    url = base_url + "/rest/api/3/issue"
    resp = requests.post(
        url, auth=auth,
        headers={"Content-Type": APPLICATION_JSON, "Accept": APPLICATION_JSON},
        json=payload, timeout=60,
    )
    if resp.status_code >= 300:
        sys.stdout.buffer.write(("[ERROR] Loi tao issue: " + str(resp.status_code) + "\n").encode("utf-8"))
        sys.stdout.buffer.write(resp.content)
        sys.stdout.buffer.write(b"\n")
        sys.stdout.buffer.flush()
        sys.exit(1)
    return resp.json()


def find_sprint_from_issue(auth, base_url, issue_key):
    """
    Doc sprint tu customfield_10018 cua mot issue (US/Story).
    Tra ve (sprint_id, sprint_name) cua sprint active, hoac sprint cuoi neu khong co active.
    """
    try:
        url = base_url + "/rest/api/3/issue/" + issue_key
        resp = requests.get(url, auth=auth,
                            params={"fields": "customfield_10018"},
                            headers={"Accept": APPLICATION_JSON}, timeout=30)
        if not resp.ok:
            return None, None
        sprints = resp.json().get("fields", {}).get("customfield_10018") or []
        if not sprints:
            return None, None
        # Uu tien sprint dang active
        active = [s for s in sprints if s.get("state") == "active"]
        chosen = active[0] if active else sprints[-1]
        return chosen["id"], chosen["name"]
    except Exception:
        return None, None


def find_active_sprint_from_boards(auth, base_url, board_ids=None):
    """
    Fallback: tim sprint active tren danh sach board IDs (theo thu tu uu tien).
    Tra ve (sprint_id, sprint_name) hoac (None, None) neu khong tim thay.
    """
    if board_ids is None:
        board_ids = FDP_SCRUM_BOARD_IDS
    for bid in board_ids:
        try:
            url = base_url + "/rest/agile/1.0/board/" + str(bid) + "/sprint"
            resp = requests.get(url, auth=auth,
                                params={"state": "active"},
                                headers={"Accept": APPLICATION_JSON}, timeout=30)
            if not resp.ok:
                continue
            sprints = resp.json().get("values", [])
            if sprints:
                s = sprints[0]
                return s["id"], s["name"]
        except Exception:
            continue
    return None, None


def link_issue(auth, base_url, inward_key, outward_key, link_type="Relates"):
    """Tao issue link: inward_key (Defect) --[Relates to]--> outward_key (US)."""
    url = base_url + "/rest/api/3/issueLink"
    payload = {
        "type": {"name": link_type},
        "inwardIssue": {"key": inward_key},
        "outwardIssue": {"key": outward_key},
    }
    resp = requests.post(url, auth=auth,
                         headers={"Content-Type": APPLICATION_JSON, "Accept": APPLICATION_JSON},
                         json=payload, timeout=30)
    return resp.status_code in (200, 201)


def extract_us_from_summary(summary):
    """Extract [FDP-XXX] dau tien tu summary neu co."""
    m = re.search(r"\[([A-Z]+-\d+)\]", summary or "")
    return m.group(1) if m else None


def upload_attachment(auth, base_url, issue_key, file_path):
    p = Path(file_path)
    if not p.exists():
        print("  [!] File khong ton tai, bo qua: " + file_path)
        return False
    url = base_url + "/rest/api/3/issue/" + issue_key + "/attachments"
    headers = {"X-Atlassian-Token": "no-check", "Accept": APPLICATION_JSON}
    with p.open("rb") as f:
        resp = requests.post(url, auth=auth, headers=headers,
                             files={"file": (p.name, f)}, timeout=120)
    if resp.status_code >= 300:
        print("  [!] Upload that bai (" + p.name + "): " + str(resp.status_code))
        return False
    print("  [OK] Da dinh kem: " + p.name)
    return True


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    args = parse_args()
    email, token, base_url = load_atlassian_credentials()
    auth = (email, token)

    priority_name = PRIORITY_TO_JIRA[args.priority] if args.priority else SEVERITY_TO_JIRA_PRIORITY[args.severity]
    jira_severity  = SEVERITY_TO_JIRA_SEVERITY[args.severity]

    print("[~] Tim issue type 'Defect' cho project " + args.project + "...")
    issue_type_id = find_defect_issue_type_id(auth, base_url, args.project)
    priority_id   = find_priority_id(auth, base_url, priority_name)

    # Labels — chỉ dùng những gì user truyền tường minh qua --labels
    labels = [l for l in args.labels if l]

    # Build ADF description
    description_adf = build_adf(args)

    # Resolve us_id truoc (can thiet cho sprint lookup)
    us_id = args.us_id or extract_us_from_summary(args.summary)

    # Resolve sprint
    sprint_id = None
    sprint_name = None
    if args.sprint is not None and str(args.sprint) != "0":
        # User truyen sprint ID tuong minh
        sprint_id = int(args.sprint)
        sprint_name = "sprint-" + str(sprint_id)
    elif args.sprint is None:
        print("[~] Tim sprint...")
        if us_id:
            # Uu tien: doc sprint tu chinh US issue
            sprint_id, sprint_name = find_sprint_from_issue(auth, base_url, us_id)
            if sprint_id:
                print("[~] Sprint tu " + us_id + ": " + sprint_name + " (id=" + str(sprint_id) + ")")
        if not sprint_id:
            # Fallback: tim sprint active tren board
            sprint_id, sprint_name = find_active_sprint_from_boards(auth, base_url)
            if sprint_id:
                print("[~] Sprint tu board: " + sprint_name + " (id=" + str(sprint_id) + ")")
            else:
                print("[!] Khong tim thay sprint, se tao issue khong gan sprint.")

    # Build payload
    fields = {
        "project":     {"key": args.project},
        "summary":     args.summary,
        "issuetype":   {"id": issue_type_id},
        "description": description_adf,
        # --- Custom fields FDP Defect ---
        CF_SEVERITY:         _select_field(jira_severity),        # single-select
        CF_ENV_FOUND:        _multi_select_field(args.env_found),  # multi-select (checkbox)
        CF_QUALITY_ACTIVITY: _select_field(args.quality_activity), # single-select
        CF_PLATFORM:         _multi_select_field(args.platform),   # multi-select (checkbox)
        CF_DEFECT_TYPE:      _select_field(args.defect_type),      # single-select
    }
    if priority_id:
        fields["priority"] = {"id": priority_id}
    if args.assignee:
        fields["assignee"] = {"accountId": args.assignee}
    if sprint_id:
        fields[CF_SPRINT] = sprint_id
    if args.parent:
        fields["parent"] = {"key": args.parent}
    if labels:
        fields["labels"] = labels
    payload = {"fields": fields}

    print("[>] Tao Defect issue tren project " + args.project
          + " | Severity=" + jira_severity
          + " | Priority=" + priority_name
          + " | Platform=" + args.platform
          + " | EnvFound=" + args.env_found
          + (" | Sprint=" + sprint_name if sprint_name else "")
          + (" | RunID=" + args.run_id if args.run_id else "")
          + (" | US=" + us_id if us_id else ""))

    result    = create_issue(auth, base_url, payload)
    issue_key = result["key"]
    issue_url = base_url + "/browse/" + issue_key
    print("[OK] Da tao: " + issue_key)

    # Link to US
    if us_id:
        ok = link_issue(auth, base_url, issue_key, us_id)
        if ok:
            print("[OK] Da link: " + issue_key + " --[Relates to]--> " + us_id)
        else:
            print("[!] Link that bai, kiem tra quyen IssueLink tren Jira.")

    if args.attachments:
        print("[>] Upload " + str(len(args.attachments)) + " file dinh kem...")
        for path in args.attachments:
            upload_attachment(auth, base_url, issue_key, path)

    print("\n" + issue_url)
    return issue_key


if __name__ == "__main__":
    main()
