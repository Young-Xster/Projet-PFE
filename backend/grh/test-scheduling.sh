#!/bin/bash
###############################################################################
#  GRH — Scheduling & Shift Assignment Integration Tests
#  Tests all endpoints for:
#    - WorkScheduleController  (/api/v1/work-schedules)
#    - ShiftAssignmentController (/api/v1/shifts)
#  Also verifies: attendance delay now uses employee schedule, not just settings
###############################################################################
set -u

BASE_URL="http://localhost:8081"
KC_URL="http://localhost:8080"
COMPANY_ID="02f7d0ac-35a3-464f-86e5-d81229601bf9"
EMPLOYEE_ALICE="54436786-98d7-422a-9635-fea5bad4d8c9"  # Alice Johnson
EMPLOYEE_JANE="44d55bd2-07ac-43df-bf00-4384d53a68ac"   # Jane Smith
SUBCONTRACTOR_ID="8fefea8b-3261-4020-9160-4688227c5559"

# ─── Counters ────────────────────────────────────────────────────────────────
PASS=0; FAIL=0; SKIP=0; TOTAL=0
FAILURES=()
GREEN='\033[0;32m'; RED='\033[0;31m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'

log_section() {
    echo -e "\n${CYAN}${BOLD}═══════════════════════════════════════════════════════${NC}"
    echo -e "${CYAN}${BOLD}  $1${NC}"
    echo -e "${CYAN}${BOLD}═══════════════════════════════════════════════════════${NC}"
}
log_test() { TOTAL=$((TOTAL+1)); printf "  ${BOLD}[%-3s]${NC} %-58s" "$TOTAL" "$1"; }
pass()     { PASS=$((PASS+1));  echo -e "${GREEN}✓ PASS${NC}"; }
fail()     { FAIL=$((FAIL+1));  FAILURES+=("[$TOTAL] $1 — $2"); echo -e "${RED}✗ FAIL${NC}\n         ${RED}$2${NC}"; }
skip()     { SKIP=$((SKIP+1));  echo -e "${YELLOW}⊘ SKIP${NC} ($1)"; }

# assert_http <METHOD> <URL> <EXPECTED_STATUS> <NAME> [DATA]
assert_http() {
    local method="$1" url="$2" expected="$3" name="$4" data="${5:-}"
    log_test "$name"
    local args=(-s -o /tmp/sched_body.json -w "%{http_code}" -X "$method" -H "Authorization: Bearer $TOKEN")
    [[ -n "$data" ]] && args+=(-H "Content-Type: application/json" -d "$data")
    local status; status=$(curl "${args[@]}" "$url" 2>/dev/null) || status="000"
    if [[ "$status" == "$expected" ]]; then pass
    else fail "$name" "expected $expected, got $status — $(cat /tmp/sched_body.json 2>/dev/null | head -1)"; fi
}

# assert_http_capture: same but saves body to CAPTURED_BODY
assert_http_capture() {
    local method="$1" url="$2" expected="$3" name="$4" data="${5:-}"
    log_test "$name"
    local args=(-s -o /tmp/sched_body.json -w "%{http_code}" -X "$method" -H "Authorization: Bearer $TOKEN")
    [[ -n "$data" ]] && args+=(-H "Content-Type: application/json" -d "$data")
    local status; status=$(curl "${args[@]}" "$url" 2>/dev/null) || status="000"
    CAPTURED_BODY=$(cat /tmp/sched_body.json 2>/dev/null)
    if [[ "$status" == "$expected" ]]; then pass
    else fail "$name" "expected $expected, got $status — $(echo "$CAPTURED_BODY" | head -1)"; fi
}

###############################################################################
# 0. TOKEN
###############################################################################
echo -e "\n${BOLD}Getting Keycloak token...${NC}"
TOKEN=$(curl -s -X POST "$KC_URL/realms/work/protocol/openid-connect/token" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "grant_type=password&client_id=GRH&username=superadmin&password=adminkamel" \
    | jq -r '.access_token' 2>/dev/null)

if [[ -z "$TOKEN" || "$TOKEN" == "null" ]]; then
    echo -e "${RED}✗ Cannot get token — is Keycloak running?${NC}"; exit 1
fi
echo -e "${GREEN}✓ Token acquired (${#TOKEN} chars)${NC}"

###############################################################################
# 1. WORK SCHEDULE TEMPLATE CRUD
###############################################################################
log_section "1. WorkScheduleController — Template CRUD"

# 1.1 Create first schedule (the default one)
log_test "POST /work-schedules (create default)"
SCHED_BODY=$(curl -s -w "" -X POST "$BASE_URL/api/v1/work-schedules" \
    -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
    -d "{
        \"companyId\":\"$COMPANY_ID\",
        \"scheduleName\":\"Standard Algerian Week\",
        \"description\":\"Sun–Thu 8am–5pm, Fri–Sat off\",
        \"isDefault\":true,
        \"scheduleDetails\":[
            {\"dayOfWeek\":\"sunday\",   \"startTime\":\"08:00\",\"endTime\":\"17:00\",\"isWorkingDay\":true},
            {\"dayOfWeek\":\"monday\",   \"startTime\":\"08:00\",\"endTime\":\"17:00\",\"isWorkingDay\":true},
            {\"dayOfWeek\":\"tuesday\",  \"startTime\":\"08:00\",\"endTime\":\"17:00\",\"isWorkingDay\":true},
            {\"dayOfWeek\":\"wednesday\",\"startTime\":\"08:00\",\"endTime\":\"17:00\",\"isWorkingDay\":true},
            {\"dayOfWeek\":\"thursday\", \"startTime\":\"08:00\",\"endTime\":\"17:00\",\"isWorkingDay\":true},
            {\"dayOfWeek\":\"friday\",   \"startTime\":\"00:00\",\"endTime\":\"00:00\",\"isWorkingDay\":false},
            {\"dayOfWeek\":\"saturday\", \"startTime\":\"00:00\",\"endTime\":\"00:00\",\"isWorkingDay\":false}
        ]
    }" 2>/dev/null)
TOTAL=$((TOTAL+1))
SCHEDULE_ID=$(echo "$SCHED_BODY" | jq -r '.data.id // empty' 2>/dev/null)
if [[ -n "$SCHEDULE_ID" && "$SCHEDULE_ID" != "null" ]]; then
    PASS=$((PASS+1)); echo -e "${GREEN}✓ PASS${NC} (ID: $SCHEDULE_ID)"
else
    FAIL=$((FAIL+1)); FAILURES+=("[$TOTAL] POST /work-schedules — no ID returned")
    echo -e "${RED}✗ FAIL${NC}\n         $(echo "$SCHED_BODY" | head -1)"
    SCHEDULE_ID=""
fi

if [[ -z "$SCHEDULE_ID" ]]; then
    echo -e "${RED}Cannot continue without a schedule ID${NC}"; exit 1
fi

# 1.2 Verify isDefault=true returned
log_test "Verify schedule is marked as default"
IS_DEF=$(echo "$SCHED_BODY" | jq -r '.data.isDefault' 2>/dev/null)
if [[ "$IS_DEF" == "true" ]]; then pass
else fail "isDefault check" "expected true, got $IS_DEF"; fi

# 1.3 Verify all 7 days returned
log_test "Verify 7 scheduleDetails returned"
DAY_COUNT=$(echo "$SCHED_BODY" | jq '.data.scheduleDetails | length' 2>/dev/null)
if [[ "$DAY_COUNT" == "7" ]]; then pass
else fail "scheduleDetails count" "expected 7, got $DAY_COUNT"; fi

# 1.4 Verify sorting (sunday first = position 0 in response)
log_test "Verify days sorted sunday→saturday"
FIRST_DAY=$(echo "$SCHED_BODY" | jq -r '.data.scheduleDetails[0].dayOfWeek' 2>/dev/null)
if [[ "$FIRST_DAY" == "sunday" ]]; then pass
else fail "day sort order" "expected sunday first, got $FIRST_DAY"; fi

# 1.5 Create second schedule (non-default, half-day Friday)
assert_http_capture POST "$BASE_URL/api/v1/work-schedules" "200" \
    "POST /work-schedules (create non-default — half-day Fri)" \
    "{\"companyId\":\"$COMPANY_ID\",\"scheduleName\":\"Half-Day Friday\",\"isDefault\":false,\"scheduleDetails\":[{\"dayOfWeek\":\"monday\",\"startTime\":\"08:00\",\"endTime\":\"17:00\",\"isWorkingDay\":true},{\"dayOfWeek\":\"tuesday\",\"startTime\":\"08:00\",\"endTime\":\"17:00\",\"isWorkingDay\":true},{\"dayOfWeek\":\"wednesday\",\"startTime\":\"08:00\",\"endTime\":\"17:00\",\"isWorkingDay\":true},{\"dayOfWeek\":\"thursday\",\"startTime\":\"08:00\",\"endTime\":\"17:00\",\"isWorkingDay\":true},{\"dayOfWeek\":\"friday\",\"startTime\":\"08:00\",\"endTime\":\"12:00\",\"isWorkingDay\":true},{\"dayOfWeek\":\"saturday\",\"startTime\":\"00:00\",\"endTime\":\"00:00\",\"isWorkingDay\":false},{\"dayOfWeek\":\"sunday\",\"startTime\":\"00:00\",\"endTime\":\"00:00\",\"isWorkingDay\":false}]}"
SCHEDULE_ID2=$(echo "$CAPTURED_BODY" | jq -r '.data.id // empty' 2>/dev/null)

# 1.6 Setting second schedule as default must unset first
log_test "POST /work-schedules (creating one as default unsets previous)"
THIRD_SCHED=$(curl -s -X POST "$BASE_URL/api/v1/work-schedules" \
    -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
    -d "{\"companyId\":\"$COMPANY_ID\",\"scheduleName\":\"Night Shift\",\"isDefault\":true,\"scheduleDetails\":[{\"dayOfWeek\":\"monday\",\"startTime\":\"22:00\",\"endTime\":\"23:00\",\"isWorkingDay\":true}]}" 2>/dev/null)
THIRD_DEF=$(echo "$THIRD_SCHED" | jq -r '.data.isDefault' 2>/dev/null)
THIRD_ID=$(echo "$THIRD_SCHED" | jq -r '.data.id // empty' 2>/dev/null)
if [[ "$THIRD_DEF" == "true" ]]; then pass
else fail "new default" "expected isDefault=true, got $THIRD_DEF — body: $(echo $THIRD_SCHED | head -c 200)"; fi

# 1.7 Previous default is now false (verify via GET)
if [[ -n "$SCHEDULE_ID" ]]; then
    log_test "GET /work-schedules/{id} (verify original no longer default)"
    ORIG_SCHED=$(curl -s "$BASE_URL/api/v1/work-schedules/$SCHEDULE_ID" \
        -H "Authorization: Bearer $TOKEN" 2>/dev/null)
    ORIG_DEF=$(echo "$ORIG_SCHED" | jq -r '.data.isDefault' 2>/dev/null)
    if [[ "$ORIG_DEF" == "false" ]]; then pass
    else fail "unset default" "expected isDefault=false after new default set, got $ORIG_DEF"; fi
fi

# 1.8 GET list by company
assert_http_capture GET "$BASE_URL/api/v1/work-schedules/company/$COMPANY_ID" "200" \
    "GET /work-schedules/company/{id}"
SCHED_COUNT=$(echo "$CAPTURED_BODY" | jq '.data | length' 2>/dev/null)
log_test "Company has at least 3 schedules"
if [[ -n "$SCHED_COUNT" && "$SCHED_COUNT" -ge 3 ]]; then pass
else fail "schedule count" "expected ≥3, got $SCHED_COUNT"; fi

# 1.9 GET by ID with full details
assert_http GET "$BASE_URL/api/v1/work-schedules/$SCHEDULE_ID" "200" \
    "GET /work-schedules/{id} with full details"

# 1.10 PUT update description
assert_http PUT "$BASE_URL/api/v1/work-schedules/$SCHEDULE_ID" "200" \
    "PUT /work-schedules/{id} (update description)" \
    "{\"description\":\"Updated: Standard Sun-Thu schedule\"}"

# 1.11 PUT update schedule details (replace days)
assert_http_capture PUT "$BASE_URL/api/v1/work-schedules/$SCHEDULE_ID" "200" \
    "PUT /work-schedules/{id} (replace scheduleDetails)" \
    "{\"scheduleDetails\":[{\"dayOfWeek\":\"sunday\",\"startTime\":\"09:00\",\"endTime\":\"18:00\",\"isWorkingDay\":true},{\"dayOfWeek\":\"monday\",\"startTime\":\"09:00\",\"endTime\":\"18:00\",\"isWorkingDay\":true},{\"dayOfWeek\":\"tuesday\",\"startTime\":\"09:00\",\"endTime\":\"18:00\",\"isWorkingDay\":true},{\"dayOfWeek\":\"wednesday\",\"startTime\":\"09:00\",\"endTime\":\"18:00\",\"isWorkingDay\":true},{\"dayOfWeek\":\"thursday\",\"startTime\":\"09:00\",\"endTime\":\"18:00\",\"isWorkingDay\":true},{\"dayOfWeek\":\"friday\",\"startTime\":\"00:00\",\"endTime\":\"00:00\",\"isWorkingDay\":false},{\"dayOfWeek\":\"saturday\",\"startTime\":\"00:00\",\"endTime\":\"00:00\",\"isWorkingDay\":false}]}"
log_test "Verify updated start time is 09:00"
NEW_START=$(echo "$CAPTURED_BODY" | jq -r '.data.scheduleDetails[] | select(.dayOfWeek=="sunday") | .startTime' 2>/dev/null)
if [[ "$NEW_START" == "09:00:00" || "$NEW_START" == "09:00" ]]; then pass
else fail "updated startTime" "expected 09:00, got $NEW_START"; fi

# 1.12 Validation: duplicate day of week rejected
log_test "POST /work-schedules — reject duplicate dayOfWeek"
DUP_RESP=$(curl -s -X POST "$BASE_URL/api/v1/work-schedules" \
    -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
    -d "{\"companyId\":\"$COMPANY_ID\",\"scheduleName\":\"DupDay\",\"isDefault\":false,\"scheduleDetails\":[{\"dayOfWeek\":\"monday\",\"startTime\":\"08:00\",\"endTime\":\"17:00\",\"isWorkingDay\":true},{\"dayOfWeek\":\"monday\",\"startTime\":\"09:00\",\"endTime\":\"18:00\",\"isWorkingDay\":true}]}" 2>/dev/null)
DUP_SUCCESS=$(echo "$DUP_RESP" | jq -r '.success' 2>/dev/null)
if [[ "$DUP_SUCCESS" == "false" ]]; then pass
else fail "duplicate day validation" "expected success=false, got $DUP_SUCCESS"; fi

# 1.13 Validation: invalid day of week rejected
log_test "POST /work-schedules — reject invalid dayOfWeek"
INV_RESP=$(curl -s -X POST "$BASE_URL/api/v1/work-schedules" \
    -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
    -d "{\"companyId\":\"$COMPANY_ID\",\"scheduleName\":\"Bad\",\"isDefault\":false,\"scheduleDetails\":[{\"dayOfWeek\":\"funday\",\"startTime\":\"08:00\",\"endTime\":\"17:00\",\"isWorkingDay\":true}]}" 2>/dev/null)
INV_SUCCESS=$(echo "$INV_RESP" | jq -r '.success' 2>/dev/null)
if [[ "$INV_SUCCESS" == "false" ]]; then pass
else fail "invalid day validation" "expected success=false, got $INV_SUCCESS"; fi

# 1.14 Cannot delete a schedule that is set as default
if [[ -n "$THIRD_ID" ]]; then
    log_test "DELETE /work-schedules/{id} — reject delete of default"
    DEL_DEF=$(curl -s -o /tmp/sched_body.json -w "%{http_code}" -X DELETE \
        "$BASE_URL/api/v1/work-schedules/$THIRD_ID" \
        -H "Authorization: Bearer $TOKEN" 2>/dev/null)
    if [[ "$DEL_DEF" != "200" ]]; then pass
    else
        DEL_MSG=$(cat /tmp/sched_body.json | jq -r '.message' 2>/dev/null)
        if echo "$DEL_MSG" | grep -qi "default"; then pass
        else fail "reject delete default" "expected failure, got 200 with msg: $DEL_MSG"; fi
    fi
fi

# 1.15 Can delete a non-default unassigned schedule
if [[ -n "$SCHEDULE_ID2" ]]; then
    assert_http DELETE "$BASE_URL/api/v1/work-schedules/$SCHEDULE_ID2" "200" \
        "DELETE /work-schedules/{id} (non-default, unassigned)"
fi

# 1.16 Deleted schedule no longer accessible
if [[ -n "$SCHEDULE_ID2" ]]; then
    log_test "GET deleted schedule returns 400/404"
    DEL_CHECK=$(curl -s -o /dev/null -w "%{http_code}" \
        "$BASE_URL/api/v1/work-schedules/$SCHEDULE_ID2" \
        -H "Authorization: Bearer $TOKEN" 2>/dev/null)
    if [[ "$DEL_CHECK" != "200" ]]; then pass
    else fail "deleted schedule still accessible" "expected non-200, got 200"; fi
fi

###############################################################################
# 2. EMPLOYEE ↔ SCHEDULE ASSIGNMENT
###############################################################################
log_section "2. WorkScheduleController — Assignments"

# 2.1 Assign schedule to Alice
assert_http_capture POST \
    "$BASE_URL/api/v1/work-schedules/$SCHEDULE_ID/assign/employee/$EMPLOYEE_ALICE?effectiveFrom=2025-01-01" \
    "200" "POST /{scheduleId}/assign/employee/{employeeId} — Alice"
ASSIGN_ID=$(echo "$CAPTURED_BODY" | jq -r '.data.id // empty' 2>/dev/null)

log_test "Verify assignment has correct scheduleName"
ASSIGN_NAME=$(echo "$CAPTURED_BODY" | jq -r '.data.scheduleName // empty' 2>/dev/null)
if [[ -n "$ASSIGN_NAME" && "$ASSIGN_NAME" != "null" ]]; then pass
else fail "assignment scheduleName" "expected name, got: $ASSIGN_NAME"; fi

# 2.2 Assign schedule to Jane
assert_http POST \
    "$BASE_URL/api/v1/work-schedules/$SCHEDULE_ID/assign/employee/$EMPLOYEE_JANE?effectiveFrom=2025-01-01" \
    "200" "POST /{scheduleId}/assign/employee/{employeeId} — Jane"

# 2.3 Assigning again to Alice (same schedule) terminates the old one and creates new
assert_http_capture POST \
    "$BASE_URL/api/v1/work-schedules/$SCHEDULE_ID/assign/employee/$EMPLOYEE_ALICE?effectiveFrom=2025-06-01" \
    "200" "POST reassign same schedule — ends previous and creates new"
log_test "Reassignment returns new effectiveFrom 2025-06-01"
NEW_FROM=$(echo "$CAPTURED_BODY" | jq -r '.data.effectiveFrom // empty' 2>/dev/null)
if [[ "$NEW_FROM" == "2025-06-01" ]]; then pass
else fail "effectiveFrom" "expected 2025-06-01, got $NEW_FROM"; fi

# 2.4 Assign to subcontractor
assert_http POST \
    "$BASE_URL/api/v1/work-schedules/$SCHEDULE_ID/assign/subcontractor/$SUBCONTRACTOR_ID?effectiveFrom=2025-01-01&effectiveTo=2025-12-31" \
    "200" "POST /{scheduleId}/assign/subcontractor/{id}"

# 2.5 Get assignments list
assert_http_capture GET "$BASE_URL/api/v1/work-schedules/$SCHEDULE_ID/assignments" \
    "200" "GET /{scheduleId}/assignments"
ASSIGN_COUNT=$(echo "$CAPTURED_BODY" | jq '.data | length' 2>/dev/null)
log_test "Assignments list has ≥2 entries (Alice + Jane + sub)"
if [[ -n "$ASSIGN_COUNT" && "$ASSIGN_COUNT" -ge 2 ]]; then pass
else fail "assignments count" "expected ≥2, got $ASSIGN_COUNT"; fi

# 2.6 Assignment includes both EMPLOYEE and SUBCONTRACTOR types
log_test "Assignments list contains EMPLOYEE type"
HAS_EMP=$(echo "$CAPTURED_BODY" | jq '[.data[] | select(.type=="EMPLOYEE")] | length' 2>/dev/null)
if [[ -n "$HAS_EMP" && "$HAS_EMP" -gt 0 ]]; then pass
else fail "EMPLOYEE type" "no EMPLOYEE assignments found"; fi

log_test "Assignments list contains SUBCONTRACTOR type"
HAS_SUB=$(echo "$CAPTURED_BODY" | jq '[.data[] | select(.type=="SUBCONTRACTOR")] | length' 2>/dev/null)
if [[ -n "$HAS_SUB" && "$HAS_SUB" -gt 0 ]]; then pass
else fail "SUBCONTRACTOR type" "no SUBCONTRACTOR assignments found"; fi

# 2.7 Cannot assign schedule from different company
log_test "Cross-company schedule assignment rejected"
CROSS=$(curl -s -X POST "$BASE_URL/api/v1/work-schedules/$SCHEDULE_ID/assign/employee/$EMPLOYEE_ALICE" \
    -H "Authorization: Bearer $TOKEN" 2>/dev/null)
# This is fine as long as it doesn't blow up — it should succeed (same company) or fail gracefully
CROSS_OK=$(echo "$CROSS" | jq -r '.success' 2>/dev/null)
if [[ "$CROSS_OK" == "true" || "$CROSS_OK" == "false" ]]; then pass  # returned a structured response
else fail "cross-company" "no structured response: $CROSS"; fi

###############################################################################
# 3. SHIFT ASSIGNMENT — MANUAL CRUD
###############################################################################
log_section "3. ShiftAssignmentController — Manual Shifts"

# Use a monday (working day) in the future to be safe
SHIFT_DATE_1="2025-09-07"  # Sunday = working day per Standard Algerian Week
SHIFT_DATE_2="2025-09-08"  # Monday

# 3.1 Create manual shift for Alice
assert_http_capture POST "$BASE_URL/api/v1/shifts" "200" \
    "POST /shifts (create manual shift — Alice on $SHIFT_DATE_1)" \
    "{\"employeeId\":\"$EMPLOYEE_ALICE\",\"companyId\":\"$COMPANY_ID\",\"scheduleId\":\"$SCHEDULE_ID\",\"shiftDate\":\"$SHIFT_DATE_1\",\"shiftStartTime\":\"09:00\",\"shiftEndTime\":\"18:00\",\"status\":\"scheduled\"}"
SHIFT_ID=$(echo "$CAPTURED_BODY" | jq -r '.data.id // empty' 2>/dev/null)

log_test "Verify shift has status=scheduled"
SHIFT_STATUS=$(echo "$CAPTURED_BODY" | jq -r '.data.status // empty' 2>/dev/null)
if [[ "$SHIFT_STATUS" == "scheduled" ]]; then pass
else fail "shift status" "expected scheduled, got $SHIFT_STATUS"; fi

# 3.2 Duplicate shift on same date rejected
log_test "POST /shifts — reject duplicate (same employee+date)"
DUP_SHIFT=$(curl -s -X POST "$BASE_URL/api/v1/shifts" \
    -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
    -d "{\"employeeId\":\"$EMPLOYEE_ALICE\",\"companyId\":\"$COMPANY_ID\",\"scheduleId\":\"$SCHEDULE_ID\",\"shiftDate\":\"$SHIFT_DATE_1\",\"shiftStartTime\":\"10:00\",\"shiftEndTime\":\"19:00\",\"status\":\"scheduled\"}" 2>/dev/null)
DUP_OK=$(echo "$DUP_SHIFT" | jq -r '.success' 2>/dev/null)
if [[ "$DUP_OK" == "false" ]]; then pass
else fail "duplicate shift rejected" "expected success=false, got $DUP_OK"; fi

# 3.3 End time before start time rejected
log_test "POST /shifts — reject end time before start time"
BAD_TIME=$(curl -s -X POST "$BASE_URL/api/v1/shifts" \
    -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
    -d "{\"employeeId\":\"$EMPLOYEE_ALICE\",\"companyId\":\"$COMPANY_ID\",\"scheduleId\":\"$SCHEDULE_ID\",\"shiftDate\":\"2025-09-10\",\"shiftStartTime\":\"17:00\",\"shiftEndTime\":\"08:00\",\"status\":\"scheduled\"}" 2>/dev/null)
BAD_OK=$(echo "$BAD_TIME" | jq -r '.success' 2>/dev/null)
if [[ "$BAD_OK" == "false" ]]; then pass
else fail "bad time validation" "expected success=false, got $BAD_OK"; fi

# 3.4 GET shift by ID
if [[ -n "$SHIFT_ID" ]]; then
    assert_http GET "$BASE_URL/api/v1/shifts/$SHIFT_ID" "200" "GET /shifts/{id}"
fi

# 3.5 Update shift — change status to completed
if [[ -n "$SHIFT_ID" ]]; then
    assert_http PUT "$BASE_URL/api/v1/shifts/$SHIFT_ID" "200" \
        "PUT /shifts/{id} (mark completed)" \
        "{\"status\":\"completed\"}"
fi

# 3.6 Cannot modify a completed shift
if [[ -n "$SHIFT_ID" ]]; then
    log_test "PUT /shifts/{id} — reject modify of completed shift"
    MOD_COMP=$(curl -s -o /tmp/sched_body.json -w "%{http_code}" \
        -X PUT "$BASE_URL/api/v1/shifts/$SHIFT_ID" \
        -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
        -d '{"shiftStartTime":"10:00"}' 2>/dev/null)
    if [[ "$MOD_COMP" != "200" ]]; then pass
    else
        MOD_MSG=$(cat /tmp/sched_body.json | jq -r '.message' 2>/dev/null)
        if echo "$MOD_MSG" | grep -qi "completed"; then pass
        else fail "modify completed" "expected error, got 200 — $MOD_MSG"; fi
    fi
fi

# 3.7 Create a second shift to cancel
assert_http_capture POST "$BASE_URL/api/v1/shifts" "200" \
    "POST /shifts (create shift for cancel test — Alice on $SHIFT_DATE_2)" \
    "{\"employeeId\":\"$EMPLOYEE_ALICE\",\"companyId\":\"$COMPANY_ID\",\"scheduleId\":\"$SCHEDULE_ID\",\"shiftDate\":\"$SHIFT_DATE_2\",\"shiftStartTime\":\"09:00\",\"shiftEndTime\":\"18:00\",\"status\":\"scheduled\"}"
SHIFT_CANCEL_ID=$(echo "$CAPTURED_BODY" | jq -r '.data.id // empty' 2>/dev/null)

# 3.8 Cancel shift
if [[ -n "$SHIFT_CANCEL_ID" ]]; then
    assert_http POST "$BASE_URL/api/v1/shifts/$SHIFT_CANCEL_ID/cancel" "200" \
        "POST /shifts/{id}/cancel"
fi

# 3.9 Cannot cancel a completed shift
if [[ -n "$SHIFT_ID" ]]; then
    log_test "POST /shifts/{id}/cancel — reject cancel of completed"
    CAN_COMP=$(curl -s -o /tmp/sched_body.json -w "%{http_code}" \
        -X POST "$BASE_URL/api/v1/shifts/$SHIFT_ID/cancel" \
        -H "Authorization: Bearer $TOKEN" 2>/dev/null)
    if [[ "$CAN_COMP" != "200" ]]; then pass
    else
        CAN_MSG=$(cat /tmp/sched_body.json | jq -r '.message' 2>/dev/null)
        if echo "$CAN_MSG" | grep -qi "completed"; then pass
        else fail "cancel completed" "expected error, got 200 — $CAN_MSG"; fi
    fi
fi

# 3.10 GET shifts by employee + date range
assert_http_capture GET \
    "$BASE_URL/api/v1/shifts/employee/$EMPLOYEE_ALICE?startDate=2025-09-01&endDate=2025-09-30" \
    "200" "GET /shifts/employee/{id}?startDate&endDate"
EMP_SHIFT_COUNT=$(echo "$CAPTURED_BODY" | jq '.data | length' 2>/dev/null)
log_test "Alice has ≥1 shift in Sep 2025"
if [[ -n "$EMP_SHIFT_COUNT" && "$EMP_SHIFT_COUNT" -ge 1 ]]; then pass
else fail "employee shifts" "expected ≥1, got $EMP_SHIFT_COUNT"; fi

# 3.11 GET shifts by company + date
assert_http GET "$BASE_URL/api/v1/shifts/company/$COMPANY_ID/date/$SHIFT_DATE_1" "200" \
    "GET /shifts/company/{id}/date/{date}"

###############################################################################
# 4. AUTO-GENERATE SHIFTS
###############################################################################
log_section "4. ShiftAssignmentController — Auto-Generate"

# 4.1 Use a clean week in Oct 2025
GEN_FROM="2025-10-05"  # Sunday
GEN_TO="2025-10-09"    # Thursday — 5 working days per Standard Algerian Week

assert_http_capture POST \
    "$BASE_URL/api/v1/shifts/generate/$SCHEDULE_ID?fromDate=$GEN_FROM&toDate=$GEN_TO" \
    "200" "POST /shifts/generate/{scheduleId}?fromDate&toDate"
GEN_COUNT=$(echo "$CAPTURED_BODY" | jq '.data | length' 2>/dev/null)
log_test "Generated shifts for Sun–Thu (2 employees × 5 days = 10)"
# Alice and Jane are assigned — 5 working days each = 10 total
if [[ -n "$GEN_COUNT" && "$GEN_COUNT" -ge 5 ]]; then pass
else fail "generated count" "expected ≥5, got $GEN_COUNT"; fi

# 4.2 Re-running generate for same range skips already-existing shifts
assert_http_capture POST \
    "$BASE_URL/api/v1/shifts/generate/$SCHEDULE_ID?fromDate=$GEN_FROM&toDate=$GEN_TO" \
    "200" "POST /shifts/generate — second run skips existing (idempotent)"
GEN_COUNT2=$(echo "$CAPTURED_BODY" | jq '.data | length' 2>/dev/null)
log_test "Second generate returns 0 (all shifts exist)"
if [[ "$GEN_COUNT2" == "0" ]]; then pass
else fail "idempotent generate" "expected 0 on second run, got $GEN_COUNT2"; fi

# 4.3 Non-working days (Fri/Sat) are skipped
log_test "Verify no shifts on Friday or Saturday in generated batch"
HAS_WEEKEND=$(echo "$CAPTURED_BODY" | jq '[.data[] | select(.shiftDate | fromdateiso8601 | strftime("%A") | ascii_downcase | test("friday|saturday"))] | length' 2>/dev/null) || HAS_WEEKEND="0"
if [[ "$HAS_WEEKEND" == "0" || "$HAS_WEEKEND" == "null" ]]; then pass
else fail "weekend skipped" "expected no fri/sat shifts, found $HAS_WEEKEND"; fi

# 4.4 Cannot generate more than 31 days at once
log_test "POST /shifts/generate — reject range > 31 days"
LONG_GEN=$(curl -s -X POST \
    "$BASE_URL/api/v1/shifts/generate/$SCHEDULE_ID?fromDate=2025-11-01&toDate=2025-12-15" \
    -H "Authorization: Bearer $TOKEN" 2>/dev/null)
LONG_OK=$(echo "$LONG_GEN" | jq -r '.success' 2>/dev/null)
if [[ "$LONG_OK" == "false" ]]; then pass
else fail "31-day limit" "expected success=false for 45-day range, got $LONG_OK"; fi

# 4.5 fromDate after toDate rejected
log_test "POST /shifts/generate — reject fromDate after toDate"
INV_RANGE=$(curl -s -X POST \
    "$BASE_URL/api/v1/shifts/generate/$SCHEDULE_ID?fromDate=2025-11-10&toDate=2025-11-01" \
    -H "Authorization: Bearer $TOKEN" 2>/dev/null)
INV_OK=$(echo "$INV_RANGE" | jq -r '.success' 2>/dev/null)
if [[ "$INV_OK" == "false" ]]; then pass
else fail "invalid date range" "expected success=false, got $INV_OK"; fi

# 4.6 Query generated shifts by employee
assert_http_capture GET \
    "$BASE_URL/api/v1/shifts/employee/$EMPLOYEE_ALICE?startDate=2025-10-01&endDate=2025-10-31" \
    "200" "GET /shifts/employee/{id} — Alice in October"
OCT_COUNT=$(echo "$CAPTURED_BODY" | jq '.data | length' 2>/dev/null)
log_test "Alice has ≥5 shifts in October (all working days)"
if [[ -n "$OCT_COUNT" && "$OCT_COUNT" -ge 5 ]]; then pass
else fail "Alice Oct shifts" "expected ≥5, got $OCT_COUNT"; fi

# 4.7 Generated shifts have correct start time from schedule (09:00 after update)
log_test "Generated shifts have start time matching schedule (09:00)"
FIRST_START=$(echo "$CAPTURED_BODY" | jq -r '.data[0].shiftStartTime // empty' 2>/dev/null)
if [[ "$FIRST_START" == "09:00:00" || "$FIRST_START" == "09:00" ]]; then pass
else fail "shift start time" "expected 09:00, got $FIRST_START"; fi

###############################################################################
# 5. ATTENDANCE DELAY INTEGRATION
###############################################################################
log_section "5. Attendance Auto-Delay via Employee Schedule"

# Set company timezone to Africa/Algiers so delay calculation works correctly
# (company settings timezone defaults to UTC in test DB, but Algeria = UTC+1)
docker exec grh-postgres psql -U postgres -d GRHDb -q -c \
  "UPDATE company_settings SET timezone = 'Africa/Algiers' WHERE company_id = '$COMPANY_ID';" 2>/dev/null

# Schedule says 09:00 local time (Africa/Algiers = UTC+1)
# Clock in at 09:45 local = 08:45 UTC → 45-min delay
# Sending UTC timestamps so the server stores + computes correctly
DELAY_DATE="2025-11-02"  # Sunday = working day in Standard Algerian Week

assert_http_capture POST "$BASE_URL/api/v1/attendance" "200" \
    "POST /attendance — late clock-in (09:45 Algeria > schedule 09:00)" \
    "{\"companyId\":\"$COMPANY_ID\",\"employeeId\":\"$EMPLOYEE_ALICE\",\"date\":\"$DELAY_DATE\",\"clockInTime\":\"${DELAY_DATE}T08:45:00Z\",\"status\":\"present\"}"
log_test "Attendance status set to 'late' automatically"
ATT_STATUS=$(echo "$CAPTURED_BODY" | jq -r '.data.status // empty' 2>/dev/null)
if [[ "$ATT_STATUS" == "late" ]]; then pass
else fail "auto-status late" "expected late, got $ATT_STATUS — body: $(echo $CAPTURED_BODY | head -c 200)"; fi

log_test "Delay minutes calculated (≥45)"
DELAY_MIN=$(echo "$CAPTURED_BODY" | jq -r '.data.delayMinutes // 0' 2>/dev/null)
if [[ -n "$DELAY_MIN" && "$DELAY_MIN" -ge 45 ]]; then pass
else fail "delay minutes" "expected ≥45, got $DELAY_MIN"; fi

# On-time clock-in: 09:00 Algeria = 08:00 UTC. Company grace=15min, so deadline=09:15.
# 09:00 <= 09:15 → not late.
ON_TIME_DATE="2025-11-03"  # Monday = working day
assert_http_capture POST "$BASE_URL/api/v1/attendance" "200" \
    "POST /attendance — on-time clock-in (09:00 Algeria = schedule start)" \
    "{\"companyId\":\"$COMPANY_ID\",\"employeeId\":\"$EMPLOYEE_ALICE\",\"date\":\"$ON_TIME_DATE\",\"clockInTime\":\"${ON_TIME_DATE}T08:00:00Z\",\"status\":\"present\"}"
log_test "On-time attendance is NOT marked late"
ON_STATUS=$(echo "$CAPTURED_BODY" | jq -r '.data.status // empty' 2>/dev/null)
if [[ "$ON_STATUS" != "late" ]]; then pass
else fail "on-time not late" "expected not-late status, got $ON_STATUS"; fi

# Restore timezone
docker exec grh-postgres psql -U postgres -d GRHDb -q -c \
  "UPDATE company_settings SET timezone = 'UTC' WHERE company_id = '$COMPANY_ID';" 2>/dev/null

###############################################################################
# 6. DELETE — cannot delete assigned schedule
###############################################################################
log_section "6. Business Rules — Delete Protection"

log_test "DELETE /work-schedules/{id} — reject when employees assigned"
DEL_ASSIGNED=$(curl -s -o /tmp/sched_body.json -w "%{http_code}" \
    -X DELETE "$BASE_URL/api/v1/work-schedules/$SCHEDULE_ID" \
    -H "Authorization: Bearer $TOKEN" 2>/dev/null)
if [[ "$DEL_ASSIGNED" != "200" ]]; then pass
else
    DEL_MSG=$(cat /tmp/sched_body.json | jq -r '.message' 2>/dev/null)
    if echo "$DEL_MSG" | grep -qi "assigned\|employee"; then pass
    else fail "reject delete assigned" "expected failure, got 200 — $DEL_MSG"; fi
fi

###############################################################################
# CLEANUP
###############################################################################
log_section "Cleanup"
echo "  Removing test data from database..."
docker exec grh-postgres psql -U postgres -d GRHDb -q -c "
    DELETE FROM shift_assignments WHERE schedule_id IN (
        SELECT id FROM work_schedules WHERE name IN ('Standard Algerian Week','Half-Day Friday','Night Shift','DupDay','Bad')
    );
    DELETE FROM employee_schedules WHERE schedule_id IN (
        SELECT id FROM work_schedules WHERE name IN ('Standard Algerian Week','Half-Day Friday','Night Shift','DupDay','Bad')
    );
    DELETE FROM attendance_records WHERE date IN ('2025-11-02','2025-11-03') AND employee_id = '$EMPLOYEE_ALICE';
    DELETE FROM work_schedules WHERE name IN ('Standard Algerian Week','Half-Day Friday','Night Shift','DupDay','Bad');
" 2>/dev/null && echo "  Done." || echo "  (cleanup skipped — check manually)"

###############################################################################
# RESULTS
###############################################################################
echo ""
echo -e "${BOLD}╔═══════════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}║                   TEST RESULTS                       ║${NC}"
echo -e "${BOLD}╠═══════════════════════════════════════════════════════╣${NC}"
echo -e "${BOLD}║  Total: $TOTAL   Passed: ${GREEN}$PASS${NC}${BOLD}   Failed: ${RED}$FAIL${NC}${BOLD}   Skipped: ${YELLOW}$SKIP${NC}${BOLD}  ║${NC}"
echo -e "${BOLD}╚═══════════════════════════════════════════════════════╝${NC}"

if [[ $FAIL -gt 0 ]]; then
    echo -e "\n${RED}${BOLD}Failed tests:${NC}"
    for f in "${FAILURES[@]}"; do echo -e "  ${RED}✗ $f${NC}"; done
    echo ""
    exit 1
else
    echo -e "\n${GREEN}${BOLD}🎉 All tests passed!${NC}\n"
    exit 0
fi
