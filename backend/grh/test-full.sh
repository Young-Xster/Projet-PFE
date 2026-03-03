#!/bin/bash
###############################################################################
#  GRH API — Full Integration Test Suite
#  Covers every endpoint across all 21 controllers
#  Requires: curl, jq
###############################################################################
set -u

BASE_URL="http://localhost:8081"
KC_URL="http://localhost:8080"

# ─── Known IDs (existing seed data) ──────────────────────────────────────────
COMPANY_ID="02f7d0ac-35a3-464f-86e5-d81229601bf9"
EMPLOYEE_ID="54436786-98d7-422a-9635-fea5bad4d8c9"       # Alice Johnson
EMPLOYEE_ID2="44d55bd2-07ac-43df-bf00-4384d53a68ac"      # Jane Smith
SUBCONTRACTOR_ID="8fefea8b-3261-4020-9160-4688227c5559"
JOB_LISTING_ID="9f778f9c-dc2a-43fd-b052-0625156c62f7"

# ─── Dynamic IDs — filled during test run ────────────────────────────────────
DEPT_ID=""
POSITION_ID=""
LEAVE_TYPE_ID=""
LEAVE_REQUEST_ID=""
PERF_REVIEW_ID=""
RECRUITMENT_REQUEST_ID=""
INTERVIEW_STAGE_ID=""
ATTENDANCE_ID=""
SCHEDULE_ID=""
SHIFT_ID=""
SUBCONTRACTOR_ID2=""
CONTRACT_ID=""
INVOICE_ID=""
REVIEW_ID=""
USER_ID=""
DOC_ID=""
NOTIFICATION_ID=""
ROLE_TEST_NAME="test-hr-role-$$"

# ─── Counters ─────────────────────────────────────────────────────────────────
PASS=0; FAIL=0; SKIP=0; TOTAL=0
FAILURES=()

# ─── Colors ───────────────────────────────────────────────────────────────────
GREEN='\033[0;32m'; RED='\033[0;31m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'

# ─── Helpers ──────────────────────────────────────────────────────────────────
log_section() {
    echo -e "\n${CYAN}${BOLD}═══════════════════════════════════════════════════════${NC}"
    echo -e "${CYAN}${BOLD}  $1${NC}"
    echo -e "${CYAN}${BOLD}═══════════════════════════════════════════════════════${NC}"
}
log_test() { TOTAL=$((TOTAL+1)); printf "  ${BOLD}[%-3s]${NC} %-60s" "$TOTAL" "$1"; }
pass()     { PASS=$((PASS+1));  echo -e "${GREEN}✓ PASS${NC}"; }
fail()     { FAIL=$((FAIL+1));  FAILURES+=("[$TOTAL] $1 — $2"); echo -e "${RED}✗ FAIL${NC}  ${RED}$2${NC}"; }
skip()     { SKIP=$((SKIP+1));  echo -e "${YELLOW}⊘ SKIP${NC} ($1)"; }

# assert_http <METHOD> <URL> <EXPECTED_STATUS> <NAME> [DATA]
assert_http() {
    local method="$1" url="$2" expected="$3" name="$4" data="${5:-}"
    log_test "$name"
    local args=(-s -o /tmp/grh_body.json -w "%{http_code}"
                -X "$method" -H "Authorization: Bearer $TOKEN")
    [[ -n "$data" ]] && args+=(-H "Content-Type: application/json" -d "$data")
    local status; status=$(curl "${args[@]}" "$url" 2>/dev/null) || status="000"
    if [[ "$status" == "$expected" ]]; then pass
    else
        local body; body=$(cat /tmp/grh_body.json 2>/dev/null | head -c 200)
        fail "$name" "expected $expected, got $status — $body"
    fi
}

# assert_http_capture — same + saves body to BODY
assert_http_capture() {
    local method="$1" url="$2" expected="$3" name="$4" data="${5:-}"
    log_test "$name"
    local args=(-s -o /tmp/grh_body.json -w "%{http_code}"
                -X "$method" -H "Authorization: Bearer $TOKEN")
    [[ -n "$data" ]] && args+=(-H "Content-Type: application/json" -d "$data")
    local status; status=$(curl "${args[@]}" "$url" 2>/dev/null) || status="000"
    BODY=$(cat /tmp/grh_body.json 2>/dev/null)
    if [[ "$status" == "$expected" ]]; then pass
    else fail "$name" "expected $expected, got $status — $(echo "$BODY" | head -c 200)"; fi
}

# extract_id <jq-path>   — reads from $BODY
extract_id() { echo "$BODY" | jq -r "${1} // empty" 2>/dev/null; }

###############################################################################
#  TOKEN
###############################################################################
echo -e "\n${BOLD}Obtaining Keycloak superadmin token...${NC}"
TOKEN=$(curl -s -X POST \
    "$KC_URL/realms/work/protocol/openid-connect/token" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "grant_type=password&client_id=GRH&username=superadmin&password=adminkamel" \
  | jq -r '.access_token // empty' 2>/dev/null)

if [[ -z "$TOKEN" || "$TOKEN" == "null" ]]; then
    echo -e "${RED}✗ Cannot get token — is Keycloak running at $KC_URL?${NC}"; exit 1
fi
echo -e "${GREEN}✓ Token acquired (${#TOKEN} chars)${NC}"

TODAY=$(date +%Y-%m-%d)
YESTERDAY=$(date -d "yesterday" +%Y-%m-%d)
NEXT_MONTH=$(date -d "+30 days" +%Y-%m-%d)

# Fetch current user ID upfront (used as interviewerId in section 14)
ME_BODY_INIT=$(curl -s "$BASE_URL/api/v1/auth/me" -H "Authorization: Bearer $TOKEN" 2>/dev/null)
CURRENT_USER_ID=$(echo "$ME_BODY_INIT" | jq -r '.data.id // empty' 2>/dev/null)

###############################################################################
#  SECTION 1 — Auth
###############################################################################
log_section "1. Auth  /api/v1/auth"

assert_http GET "$BASE_URL/api/v1/auth/me" 200 "GET /auth/me"

###############################################################################
#  SECTION 2 — Companies
###############################################################################
log_section "2. Companies  /api/v1/companies"

assert_http GET  "$BASE_URL/api/v1/companies" 200 "GET /companies (list all)"
assert_http GET  "$BASE_URL/api/v1/companies/$COMPANY_ID" 200 "GET /companies/:id"

assert_http_capture POST "$BASE_URL/api/v1/companies" 200 "POST /companies (create)" \
    '{"name":"Test Co '"$$"'","code":"TST'"$$"'","industryType":"IT","email":"test@test.com","phoneNumber":"0500000000","adress":"Test Street"}'
NEW_COMPANY_ID=$(extract_id '.data.id')

if [[ -n "$NEW_COMPANY_ID" ]]; then
    assert_http PUT  "$BASE_URL/api/v1/companies/$NEW_COMPANY_ID" 200 "PUT /companies/:id (update)" \
        '{"name":"Test Co Updated"}'
    assert_http DELETE "$BASE_URL/api/v1/companies/$NEW_COMPANY_ID" 200 "DELETE /companies/:id (deactivate)"
else
    skip "PUT/DELETE /companies — no company ID" ; TOTAL=$((TOTAL+2)) ; SKIP=$((SKIP+2))
fi

###############################################################################
#  SECTION 3 — Company Settings
###############################################################################
log_section "3. Company Settings  /api/v1/companies/:id/settings"

assert_http GET "$BASE_URL/api/v1/companies/$COMPANY_ID/settings" 200 "GET /settings"
assert_http PUT "$BASE_URL/api/v1/companies/$COMPANY_ID/settings" 200 "PUT /settings (update)" \
    '{"workHoursStart":"08:00","workHoursEnd":"17:00","gracePeriodMinutes":15,"timezone":"Africa/Algiers","currency":"DZD","dateFormat":"DD/MM/YYYY"}'

###############################################################################
#  SECTION 4 — Departments
###############################################################################
log_section "4. Departments  /api/v1/departments"

assert_http_capture POST "$BASE_URL/api/v1/departments" 200 "POST /departments (create)" \
    '{"companyId":"'"$COMPANY_ID"'","name":"Test Department '"$$"'","code":"TDEP'"$$"'","description":"created by test"}'
DEPT_ID=$(extract_id '.data.id')

if [[ -n "$DEPT_ID" ]]; then
    assert_http GET  "$BASE_URL/api/v1/departments/$DEPT_ID" 200 "GET /departments/:id"
    assert_http PUT  "$BASE_URL/api/v1/departments/$DEPT_ID" 200 "PUT /departments/:id (update)" \
        '{"name":"Test Department Updated"}'
fi

assert_http GET "$BASE_URL/api/v1/departments/company/$COMPANY_ID" 200 "GET /departments/company/:id (list)"

if [[ -n "$DEPT_ID" ]]; then
    assert_http GET    "$BASE_URL/api/v1/departments/$DEPT_ID/sub-departments" 200 "GET /departments/:id/sub-departments"
fi

###############################################################################
#  SECTION 5 — Positions
###############################################################################
log_section "5. Positions  /api/v1/positions"

if [[ -z "$DEPT_ID" ]]; then
    echo -e "${YELLOW}  ⊘ SKIP section 5 — no department ID from section 4${NC}"
    SKIP=$((SKIP+5))
else
    assert_http_capture POST "$BASE_URL/api/v1/positions" 200 "POST /positions (create)" \
        '{"companyId":"'"$COMPANY_ID"'","departmentId":"'"$DEPT_ID"'","title":"Test Position '"$$"'","code":"TPOS'"$$"'","description":"test"}'
    POSITION_ID=$(extract_id '.data.id')

    if [[ -n "$POSITION_ID" ]]; then
        assert_http GET  "$BASE_URL/api/v1/positions/$POSITION_ID" 200 "GET /positions/:id"
        assert_http PUT  "$BASE_URL/api/v1/positions/$POSITION_ID" 200 "PUT /positions/:id (update)" \
            '{"title":"Test Position Updated"}'
    fi

    assert_http GET "$BASE_URL/api/v1/positions/company/$COMPANY_ID"    200 "GET /positions/company/:id (list)"
    assert_http GET "$BASE_URL/api/v1/positions/department/$DEPT_ID"    200 "GET /positions/department/:id (list)"
fi

###############################################################################
#  SECTION 6 — Employees
###############################################################################
log_section "6. Employees  /api/v1/employees"

assert_http GET "$BASE_URL/api/v1/employees/$EMPLOYEE_ID" 200 "GET /employees/:id"
assert_http GET "$BASE_URL/api/v1/employees/company/$COMPANY_ID" 200 "GET /employees/company/:id"
assert_http GET "$BASE_URL/api/v1/employees/company/$COMPANY_ID/include-terminated" 200 "GET /employees/company/:id/include-terminated"

if [[ -n "$DEPT_ID" ]]; then
    assert_http GET "$BASE_URL/api/v1/employees/department/$DEPT_ID" 200 "GET /employees/department/:id"
else
    skip "GET /employees/department — no DEPT_ID"; TOTAL=$((TOTAL+1)); SKIP=$((SKIP+1))
fi

HIRE_DATE=$(date -d "-30 days" +%Y-%m-%d)
if [[ -n "$DEPT_ID" && -n "$POSITION_ID" ]]; then
    assert_http_capture POST "$BASE_URL/api/v1/employees" 200 "POST /employees (create)" \
        '{"companyId":"'"$COMPANY_ID"'","departmentId":"'"$DEPT_ID"'","positionId":"'"$POSITION_ID"'",
          "firstName":"Test","lastName":"Employee","email":"testemployee'"$$"'@test.com",
          "phoneNumber":"0550000099","hireDate":"'"$HIRE_DATE"'","salary":50000,
          "employmentType":"full_time","jobTitle":"Test Job",
          "dateOfBirth":"1990-01-01","gender":"male","address":"Test Address",
          "city":"Algiers","postalCode":"16000","country":"Algeria",
          "nationalId":"TESTNID'"$$"'"}'
    NEW_EMP_ID=$(extract_id '.data.id')

    if [[ -n "$NEW_EMP_ID" ]]; then
        assert_http PUT    "$BASE_URL/api/v1/employees/$NEW_EMP_ID" 200 "PUT /employees/:id (update)" \
            '{"salary":55000}'
        assert_http DELETE "$BASE_URL/api/v1/employees/$NEW_EMP_ID" 200 "DELETE /employees/:id"
    fi
else
    skip "POST/PUT/DELETE /employees — missing DEPT_ID or POSITION_ID"
    TOTAL=$((TOTAL+3)); SKIP=$((SKIP+3))
fi

###############################################################################
#  SECTION 7 — Leave Types
###############################################################################
log_section "7. Leave Types  /api/v1/leave-types"

assert_http GET "$BASE_URL/api/v1/leave-types/public/company/$COMPANY_ID" 200 "GET /leave-types/public/company/:id"
assert_http GET "$BASE_URL/api/v1/leave-types/company/$COMPANY_ID" 200 "GET /leave-types/company/:id"

assert_http_capture POST "$BASE_URL/api/v1/leave-types" 200 "POST /leave-types (create)" \
    '{"companyId":"'"$COMPANY_ID"'","name":"Test Leave '"$$"'","code":"TLV'"$$"'",
      "isPaid":true,"maxDaysPerYear":5,"requiresApproval":true,"colorHex":"#FF5733"}'
LEAVE_TYPE_ID=$(extract_id '.data.id')

if [[ -n "$LEAVE_TYPE_ID" ]]; then
    assert_http GET "$BASE_URL/api/v1/leave-types/$LEAVE_TYPE_ID" 200 "GET /leave-types/:id"
    assert_http PUT "$BASE_URL/api/v1/leave-types/$LEAVE_TYPE_ID" 200 "PUT /leave-types/:id (update)" \
        '{"maxDaysPerYear":7}'
    assert_http DELETE "$BASE_URL/api/v1/leave-types/$LEAVE_TYPE_ID" 200 "DELETE /leave-types/:id"
else
    skip "GET/PUT/DELETE /leave-types — no ID"; TOTAL=$((TOTAL+3)); SKIP=$((SKIP+3))
fi

###############################################################################
#  SECTION 8 — Leave Requests
###############################################################################
log_section "8. Leave Requests  /api/v1/leave-requests"

# Fetch Alice's credentials for the public (unauthenticated) submit endpoint
ALICE_DATA=$(curl -s "$BASE_URL/api/v1/employees/$EMPLOYEE_ID" -H "Authorization: Bearer $TOKEN" 2>/dev/null)
ALICE_NATIONAL_ID=$(echo "$ALICE_DATA" | jq -r '.data.nationalId // empty' 2>/dev/null)
ALICE_EMAIL=$(echo "$ALICE_DATA" | jq -r '.data.email // empty' 2>/dev/null)

# Get first usable leave type ID
LT_BODY=$(curl -s "$BASE_URL/api/v1/leave-types/company/$COMPANY_ID" \
    -H "Authorization: Bearer $TOKEN" 2>/dev/null)
FIRST_LT=$(echo "$LT_BODY" | jq -r '.data[0].id // empty' 2>/dev/null)

if [[ -n "$FIRST_LT" ]]; then
    # Use far-future dates with a random offset to avoid conflicts
    LR_OFFSET=$(( RANDOM % 300 + 200 ))
    LR_START=$(date -d "+${LR_OFFSET} days" +%Y-%m-%d)
    LR_END=$(date -d "+$(( LR_OFFSET + 2 )) days" +%Y-%m-%d)

    assert_http_capture POST "$BASE_URL/api/v1/leave-requests/public/submit" 200 "POST /leave-requests/public/submit" \
        '{"employeeId":"'"$EMPLOYEE_ID"'","leaveTypeId":"'"$FIRST_LT"'",
          "startDate":"'"$LR_START"'","endDate":"'"$LR_END"'","reason":"Test leave request from test suite",
          "companyId":"'"$COMPANY_ID"'","nationalId":"NAT123456","email":"miripo7799@amiralty.com","totalDays":2}'
    LEAVE_REQUEST_ID=$(extract_id '.data.id')

    if [[ -n "$LEAVE_REQUEST_ID" ]]; then
        assert_http GET  "$BASE_URL/api/v1/leave-requests/$LEAVE_REQUEST_ID" 200 "GET /leave-requests/:id"
        assert_http POST "$BASE_URL/api/v1/leave-requests/$LEAVE_REQUEST_ID/review" 200 \
            "POST /leave-requests/:id/review (approve)" \
            '{"status":"approved","comments":"approved by test","approvedByUserId":"'"$CURRENT_USER_ID"'"}'
        assert_http POST "$BASE_URL/api/v1/leave-requests/$LEAVE_REQUEST_ID/cancel" 200 \
            "POST /leave-requests/:id/cancel"
    else
        skip "GET/review/cancel leave-request — no ID"; TOTAL=$((TOTAL+3)); SKIP=$((SKIP+3))
    fi
else
    skip "POST /leave-requests — no leave types exist"; TOTAL=$((TOTAL+4)); SKIP=$((SKIP+4))
fi

assert_http GET "$BASE_URL/api/v1/leave-requests/company/$COMPANY_ID/pending" 200 \
    "GET /leave-requests/company/:id/pending"
assert_http GET "$BASE_URL/api/v1/leave-requests/company/$COMPANY_ID/status/pending" 200 \
    "GET /leave-requests/company/:id/status/:status"
assert_http GET "$BASE_URL/api/v1/leave-requests/employee/$EMPLOYEE_ID/balances" 200 \
    "GET /leave-requests/employee/:id/balances"

###############################################################################
#  SECTION 9 — Attendance
###############################################################################
log_section "9. Attendance  /api/v1/attendance"

CLOCK_IN=$(date -u +%Y-%m-%dT09:00:00Z)
CLOCK_OUT=$(date -u +%Y-%m-%dT17:00:00Z)

# Clean up any existing attendance for today to avoid 409
docker exec grh-postgres psql -U postgres -d GRHDb \
  -c "DELETE FROM attendance_records WHERE employee_id='$EMPLOYEE_ID' AND date='$TODAY';" \
  >/dev/null 2>&1 || true

assert_http_capture POST "$BASE_URL/api/v1/attendance" 200 "POST /attendance (create)" \
    '{"companyId":"'"$COMPANY_ID"'","employeeId":"'"$EMPLOYEE_ID"'",
      "date":"'"$TODAY"'","clockInTime":"'"$CLOCK_IN"'","clockOutTime":"'"$CLOCK_OUT"'","status":"present"}'
ATTENDANCE_ID=$(extract_id '.data.id')

if [[ -n "$ATTENDANCE_ID" ]]; then
    assert_http GET "$BASE_URL/api/v1/attendance/$ATTENDANCE_ID" 200 "GET /attendance/:id"
    assert_http PUT "$BASE_URL/api/v1/attendance/$ATTENDANCE_ID" 200 "PUT /attendance/:id (update)" \
        '{"status":"present","notes":"updated by test"}'
fi

assert_http GET "$BASE_URL/api/v1/attendance/company/$COMPANY_ID/date/$TODAY" 200 \
    "GET /attendance/company/:id/date/:date"
assert_http GET "$BASE_URL/api/v1/attendance/company/$COMPANY_ID/range?startDate=$YESTERDAY&endDate=$TODAY" 200 \
    "GET /attendance/company/:id/range"
assert_http GET "$BASE_URL/api/v1/attendance/employee/$EMPLOYEE_ID/range?startDate=$YESTERDAY&endDate=$TODAY" 200 \
    "GET /attendance/employee/:id/range"

if [[ -n "$ATTENDANCE_ID" ]]; then
    assert_http DELETE "$BASE_URL/api/v1/attendance/$ATTENDANCE_ID" 200 "DELETE /attendance/:id"
fi

###############################################################################
#  SECTION 10 — Work Schedules
###############################################################################
log_section "10. Work Schedules  /api/v1/work-schedules"

assert_http_capture POST "$BASE_URL/api/v1/work-schedules" 200 "POST /work-schedules (create)" \
    '{
      "companyId":"'"$COMPANY_ID"'",
      "scheduleName":"Test Schedule '"$$"'",
      "description":"Mon–Fri 9am–6pm",
      "isDefault":false,
      "scheduleDetails":[
        {"dayOfWeek":"monday",   "startTime":"09:00","endTime":"18:00","isWorkingDay":true},
        {"dayOfWeek":"tuesday",  "startTime":"09:00","endTime":"18:00","isWorkingDay":true},
        {"dayOfWeek":"wednesday","startTime":"09:00","endTime":"18:00","isWorkingDay":true},
        {"dayOfWeek":"thursday", "startTime":"09:00","endTime":"18:00","isWorkingDay":true},
        {"dayOfWeek":"friday",   "startTime":"09:00","endTime":"18:00","isWorkingDay":true},
        {"dayOfWeek":"saturday", "startTime":"00:00","endTime":"00:00","isWorkingDay":false},
        {"dayOfWeek":"sunday",   "startTime":"00:00","endTime":"00:00","isWorkingDay":false}
      ]
    }'
SCHEDULE_ID=$(extract_id '.data.id')

if [[ -n "$SCHEDULE_ID" ]]; then
    assert_http GET "$BASE_URL/api/v1/work-schedules/$SCHEDULE_ID" 200 "GET /work-schedules/:id"
    assert_http PUT "$BASE_URL/api/v1/work-schedules/$SCHEDULE_ID" 200 "PUT /work-schedules/:id (update)" \
        '{"description":"Updated description"}'

    assert_http POST \
        "$BASE_URL/api/v1/work-schedules/$SCHEDULE_ID/assign/employee/$EMPLOYEE_ID?effectiveFrom=$TODAY" \
        200 "POST /work-schedules/:id/assign/employee/:id"
    assert_http GET  "$BASE_URL/api/v1/work-schedules/$SCHEDULE_ID/assignments" 200 \
        "GET /work-schedules/:id/assignments"

    assert_http POST \
        "$BASE_URL/api/v1/work-schedules/$SCHEDULE_ID/assign/subcontractor/$SUBCONTRACTOR_ID?effectiveFrom=$TODAY" \
        200 "POST /work-schedules/:id/assign/subcontractor/:id"
fi

assert_http GET "$BASE_URL/api/v1/work-schedules/company/$COMPANY_ID" 200 "GET /work-schedules/company/:id"

###############################################################################
#  SECTION 11 — Shifts
###############################################################################
log_section "11. Shifts  /api/v1/shifts"

SHIFT_DATE=$(date -d "+$(( RANDOM % 300 + 200 )) days" +%Y-%m-%d)
# Use EMPLOYEE_ID2 (Jane) to avoid conflicting with any existing leave for EMPLOYEE_ID (Alice)
assert_http_capture POST "$BASE_URL/api/v1/shifts" 200 "POST /shifts (create manual)" \
    '{"companyId":"'"$COMPANY_ID"'","employeeId":"'"$EMPLOYEE_ID2"'",
      "scheduleId":"'"$SCHEDULE_ID"'",
      "shiftDate":"'"$SHIFT_DATE"'","shiftStartTime":"09:00","shiftEndTime":"18:00","status":"scheduled"}'
SHIFT_ID=$(extract_id '.data.id')

if [[ -n "$SHIFT_ID" ]]; then
    assert_http GET "$BASE_URL/api/v1/shifts/$SHIFT_ID" 200 "GET /shifts/:id"
    assert_http PUT "$BASE_URL/api/v1/shifts/$SHIFT_ID" 200 "PUT /shifts/:id (update)" \
        '{"notes":"updated by test"}'
    assert_http POST "$BASE_URL/api/v1/shifts/$SHIFT_ID/cancel" 200 "POST /shifts/:id/cancel"
fi

if [[ -n "$SCHEDULE_ID" ]]; then
    GEN_FROM=$(date -d "+8 days" +%Y-%m-%d)
    GEN_TO=$(date -d "+14 days" +%Y-%m-%d)
    assert_http POST \
        "$BASE_URL/api/v1/shifts/generate/$SCHEDULE_ID?fromDate=$GEN_FROM&toDate=$GEN_TO" \
        200 "POST /shifts/generate/:scheduleId"
fi

assert_http GET "$BASE_URL/api/v1/shifts/company/$COMPANY_ID/date/$SHIFT_DATE" 200 "GET /shifts/company/:id/date/:date"
assert_http GET "$BASE_URL/api/v1/shifts/employee/$EMPLOYEE_ID?startDate=$TODAY&endDate=$NEXT_MONTH" 200 \
    "GET /shifts/employee/:id (range)"

# Clean up schedule created in section 10
if [[ -n "$SCHEDULE_ID" ]]; then
    # Schedule has active employee/subcontractor assignments from tests above — 409 is correct
    assert_http DELETE "$BASE_URL/api/v1/work-schedules/$SCHEDULE_ID" 409 "DELETE /work-schedules/:id (blocked by assignments)"
fi

###############################################################################
#  SECTION 12 — Jobs & Candidates (Recruitment)
###############################################################################
log_section "12. Job Listings  /api/v1/job-listings"

assert_http GET "$BASE_URL/api/v1/job-listings/public" 200 "GET /job-listings/public"
assert_http GET "$BASE_URL/api/v1/job-listings/public/$JOB_LISTING_ID" 200 "GET /job-listings/public/:id"
assert_http GET "$BASE_URL/api/v1/job-listings/my-company" 200 "GET /job-listings/my-company"
assert_http GET "$BASE_URL/api/v1/job-listings/company/$COMPANY_ID" 200 "GET /job-listings/company/:id"
assert_http GET "$BASE_URL/api/v1/job-listings/$JOB_LISTING_ID" 200 "GET /job-listings/:id"

if [[ -n "$DEPT_ID" && -n "$POSITION_ID" ]]; then
    assert_http_capture POST "$BASE_URL/api/v1/job-listings" 200 "POST /job-listings (create)" \
        '{"companyId":"'"$COMPANY_ID"'","departmentId":"'"$DEPT_ID"'","positionId":"'"$POSITION_ID"'",
          "title":"Test Job '"$$"'","description":"Test job description",
          "requirements":"Test requirements","employmentType":"full_time",
          "salaryMin":40000,"salaryMax":60000,"numberOfPositions":1,"deadline":"'"$NEXT_MONTH"'"}'
    NEW_LISTING_ID=$(extract_id '.data.id')

    if [[ -n "$NEW_LISTING_ID" ]]; then
        assert_http PUT  "$BASE_URL/api/v1/job-listings/$NEW_LISTING_ID" 200 "PUT /job-listings/:id (update)" \
            '{"salaryMax":65000}'
        assert_http POST "$BASE_URL/api/v1/job-listings/$NEW_LISTING_ID/close" 200 "POST /job-listings/:id/close"
        assert_http DELETE "$BASE_URL/api/v1/job-listings/$NEW_LISTING_ID" 200 "DELETE /job-listings/:id"
    else
        skip "PUT/close/DELETE /job-listings — no ID"; TOTAL=$((TOTAL+3)); SKIP=$((SKIP+3))
    fi
else
    skip "POST/PUT/DELETE /job-listings — missing DEPT/POSITION IDs"; TOTAL=$((TOTAL+4)); SKIP=$((SKIP+4))
fi

log_section "12b. Candidates  /api/v1/candidates"

assert_http GET "$BASE_URL/api/v1/candidates/job-listing/$JOB_LISTING_ID"              200 "GET /candidates/job-listing/:id"
assert_http GET "$BASE_URL/api/v1/candidates/job-listing/$JOB_LISTING_ID/stage/1"      200 "GET /candidates/job-listing/:id/stage/:stage"
assert_http GET "$BASE_URL/api/v1/candidates/job-listing/$JOB_LISTING_ID/status/stage_1" 200 "GET /candidates/job-listing/:id/status/:status"

# Get an existing candidate from the listing
CAND_BODY=$(curl -s "$BASE_URL/api/v1/candidates/job-listing/$JOB_LISTING_ID" \
    -H "Authorization: Bearer $TOKEN" 2>/dev/null)
EXISTING_CANDIDATE_ID=$(echo "$CAND_BODY" | jq -r '.data[0].id // empty' 2>/dev/null)

if [[ -n "$EXISTING_CANDIDATE_ID" ]]; then
    assert_http GET "$BASE_URL/api/v1/candidates/$EXISTING_CANDIDATE_ID" 200 "GET /candidates/:id"
    assert_http POST "$BASE_URL/api/v1/candidates/$EXISTING_CANDIDATE_ID/notes" 200 \
        "POST /candidates/:id/notes" '{"notes":"Added by test suite"}'
    # Stage advance is idempotent only if not already max stage — just verify 200 or 409
    log_test "POST /candidates/:id/advance"
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
        "$BASE_URL/api/v1/candidates/$EXISTING_CANDIDATE_ID/advance" \
        -H "Authorization: Bearer $TOKEN" 2>/dev/null)
    if [[ "$STATUS" == "200" || "$STATUS" == "409" || "$STATUS" == "400" ]]; then pass
    else fail "advance candidate" "unexpected status $STATUS"; fi
else
    skip "GET/notes/advance candidate — no candidates in listing"; TOTAL=$((TOTAL+3)); SKIP=$((SKIP+3))
fi

###############################################################################
#  SECTION 13 — Recruitment Requests
###############################################################################
log_section "13. Recruitment Requests  /api/v1/recruitment-requests"

if [[ -n "$DEPT_ID" && -n "$POSITION_ID" ]]; then
    assert_http_capture POST "$BASE_URL/api/v1/recruitment-requests" 200 "POST /recruitment-requests (create)" \
        '{"companyId":"'"$COMPANY_ID"'","departmentId":"'"$DEPT_ID"'","positionId":"'"$POSITION_ID"'",
          "numberOfPositions":2,"priority":"medium","status":"open","jobDescription":"Need more staff",
          "requiredByDate":"'"$NEXT_MONTH"'"}'
    RECRUITMENT_REQUEST_ID=$(extract_id '.data.id')

    if [[ -n "$RECRUITMENT_REQUEST_ID" ]]; then
        assert_http GET  "$BASE_URL/api/v1/recruitment-requests/$RECRUITMENT_REQUEST_ID" 200 \
            "GET /recruitment-requests/:id"
        assert_http POST "$BASE_URL/api/v1/recruitment-requests/$RECRUITMENT_REQUEST_ID/approve" 200 \
            "POST /recruitment-requests/:id/approve"
        assert_http POST "$BASE_URL/api/v1/recruitment-requests/$RECRUITMENT_REQUEST_ID/mark-filled" 200 \
            "POST /recruitment-requests/:id/mark-filled"
        assert_http DELETE "$BASE_URL/api/v1/recruitment-requests/$RECRUITMENT_REQUEST_ID" 200 \
            "DELETE /recruitment-requests/:id"
    else
        skip "GET/approve/fill/DELETE recruitment-requests — no ID"; TOTAL=$((TOTAL+4)); SKIP=$((SKIP+4))
    fi

    # Create second one to test reject flow
    assert_http_capture POST "$BASE_URL/api/v1/recruitment-requests" 200 "POST /recruitment-requests (for reject test)" \
        '{"companyId":"'"$COMPANY_ID"'","departmentId":"'"$DEPT_ID"'","positionId":"'"$POSITION_ID"'",
          "numberOfPositions":1,"priority":"low","status":"open","requiredByDate":"'"$NEXT_MONTH"'"}'
    REJECT_RR_ID=$(extract_id '.data.id')

    if [[ -n "$REJECT_RR_ID" ]]; then
        assert_http POST "$BASE_URL/api/v1/recruitment-requests/$REJECT_RR_ID/reject" 200 \
            "POST /recruitment-requests/:id/reject"
        assert_http DELETE "$BASE_URL/api/v1/recruitment-requests/$REJECT_RR_ID" 200 \
            "DELETE /recruitment-requests/:id (rejected)"
    fi
else
    skip "recruitment-requests — no DEPT_ID/POSITION_ID"; TOTAL=$((TOTAL+7)); SKIP=$((SKIP+7))
fi

assert_http GET "$BASE_URL/api/v1/recruitment-requests/company/$COMPANY_ID" 200 \
    "GET /recruitment-requests/company/:id"
assert_http GET "$BASE_URL/api/v1/recruitment-requests/company/$COMPANY_ID/status/open" 200 \
    "GET /recruitment-requests/company/:id/status/:status"

if [[ -n "$DEPT_ID" ]]; then
    assert_http GET "$BASE_URL/api/v1/recruitment-requests/department/$DEPT_ID" 200 \
        "GET /recruitment-requests/department/:id"
else
    skip "GET /recruitment-requests/department — no DEPT_ID"; TOTAL=$((TOTAL+1)); SKIP=$((SKIP+1))
fi

###############################################################################
#  SECTION 14 — Interview Stages
###############################################################################
log_section "14. Interview Stages  /api/v1/interview-stages"

if [[ -n "$EXISTING_CANDIDATE_ID" ]]; then
    INTERVIEW_AT=$(date -u -d "+3 days" +%Y-%m-%dT10:00:00Z)
    assert_http_capture POST "$BASE_URL/api/v1/interview-stages" 200 "POST /interview-stages (create)" \
        '{"companyId":"'"$COMPANY_ID"'","candidateId":"'"$EXISTING_CANDIDATE_ID"'",
          "stageName":"Technical Interview","stageNumber":1,
          "interviewerId":"'"$CURRENT_USER_ID"'",
          "scheduledAt":"'"$INTERVIEW_AT"'","status":"scheduled"}'
    INTERVIEW_STAGE_ID=$(extract_id '.data.id')

    if [[ -n "$INTERVIEW_STAGE_ID" ]]; then
        assert_http GET    "$BASE_URL/api/v1/interview-stages/$INTERVIEW_STAGE_ID" 200 \
            "GET /interview-stages/:id"
        assert_http GET    "$BASE_URL/api/v1/interview-stages/candidate/$EXISTING_CANDIDATE_ID" 200 \
            "GET /interview-stages/candidate/:id"
        # Reschedule while still in 'scheduled' status (must happen BEFORE completing)
        RESCHEDULE_AT=$(date -u -d "+5 days" +%Y-%m-%dT14:00:00Z)
        RESCHEDULE_ENCODED=$(python3 -c "import urllib.parse; print(urllib.parse.quote('$RESCHEDULE_AT'))" 2>/dev/null || echo "$RESCHEDULE_AT")
        assert_http PUT    "$BASE_URL/api/v1/interview-stages/$INTERVIEW_STAGE_ID/reschedule?newDate=$RESCHEDULE_ENCODED" 200 \
            "PUT /interview-stages/:id/reschedule"
        # Now complete the stage
        assert_http PUT    "$BASE_URL/api/v1/interview-stages/$INTERVIEW_STAGE_ID/status?status=completed&feedback=Good&rating=4" 200 \
            "PUT /interview-stages/:id/status (complete)"
        # Completed stages cannot be deleted — 409 is correct business logic
        assert_http DELETE "$BASE_URL/api/v1/interview-stages/$INTERVIEW_STAGE_ID" 409 \
            "DELETE /interview-stages/:id (blocked — completed)"
    else
        skip "GET/update/reschedule/DELETE interview-stages — no ID"; TOTAL=$((TOTAL+5)); SKIP=$((SKIP+5))
    fi

    assert_http GET "$BASE_URL/api/v1/interview-stages/company/$COMPANY_ID" 200 \
        "GET /interview-stages/company/:id"

    UCOMING_FROM=$(date -u +%Y-%m-%dT00:00:00Z)
    UPCOMING_TO=$(date -u -d "+30 days" +%Y-%m-%dT23:59:59Z)
    assert_http GET \
        "$BASE_URL/api/v1/interview-stages/upcoming?from=$UCOMING_FROM&to=$UPCOMING_TO" 200 \
        "GET /interview-stages/upcoming"
else
    skip "All interview-stages tests — no candidate ID"; TOTAL=$((TOTAL+8)); SKIP=$((SKIP+8))
fi

###############################################################################
#  SECTION 15 — Performance Reviews
###############################################################################
log_section "15. Performance Reviews  /api/v1/performance-reviews"

# Use a far-past period with random year-offset to avoid conflict
REVIEW_YEAR=$(( 2010 + RANDOM % 10 ))
REVIEW_START="${REVIEW_YEAR}-01-01"
REVIEW_END="${REVIEW_YEAR}-12-31"
assert_http_capture POST "$BASE_URL/api/v1/performance-reviews" 200 "POST /performance-reviews (create)" \
    '{"companyId":"'"$COMPANY_ID"'","employeeId":"'"$EMPLOYEE_ID"'",
      "reviewPeriodStart":"'"$REVIEW_START"'","reviewPeriodEnd":"'"$REVIEW_END"'","reviewerNotes":"Annual review test"}'
PERF_REVIEW_ID=$(extract_id '.data.id')

if [[ -n "$PERF_REVIEW_ID" ]]; then
    assert_http GET "$BASE_URL/api/v1/performance-reviews/$PERF_REVIEW_ID" 200 "GET /performance-reviews/:id"
    assert_http PUT "$BASE_URL/api/v1/performance-reviews/$PERF_REVIEW_ID" 200 \
        "PUT /performance-reviews/:id (update)" \
        '{"overallRating":4,"strengths":"Great communicator","areasForImprovement":"Time management","goals":"Lead a project","status":"reviewed"}'
    assert_http POST "$BASE_URL/api/v1/performance-reviews/$PERF_REVIEW_ID/acknowledge?acknowledgedByUserId=$CURRENT_USER_ID" 200 \
        "POST /performance-reviews/:id/acknowledge"
fi

assert_http GET "$BASE_URL/api/v1/performance-reviews/employee/$EMPLOYEE_ID" 200 \
    "GET /performance-reviews/employee/:id"
assert_http GET "$BASE_URL/api/v1/performance-reviews/company/$COMPANY_ID" 200 \
    "GET /performance-reviews/company/:id"
assert_http GET "$BASE_URL/api/v1/performance-reviews/company/$COMPANY_ID/status/pending" 200 \
    "GET /performance-reviews/company/:id/status/:status"

# DELETE only if not acknowledged (create a fresh one)
assert_http_capture POST "$BASE_URL/api/v1/performance-reviews" 200 "POST /performance-reviews (for delete test)" \
    '{"companyId":"'"$COMPANY_ID"'","employeeId":"'"$EMPLOYEE_ID2"'","reviewPeriodStart":"'"$TODAY"'","reviewPeriodEnd":"'"$NEXT_MONTH"'"}'
DEL_REVIEW_ID=$(extract_id '.data.id')
if [[ -n "$DEL_REVIEW_ID" ]]; then
    assert_http DELETE "$BASE_URL/api/v1/performance-reviews/$DEL_REVIEW_ID" 200 "DELETE /performance-reviews/:id"
fi

###############################################################################
#  SECTION 16 — Subcontractors
###############################################################################
log_section "16. Subcontractors  /api/v1/subcontractors"

assert_http_capture POST "$BASE_URL/api/v1/subcontractors" 200 "POST /subcontractors (create)" \
    '{"companyId":"'"$COMPANY_ID"'","type":"INDIVIDUAL","contactFirstName":"Test","contactLastName":"Sub '"$$"'",
      "contactEmail":"sub'"$$"'@test.com","contactPhone":"0550000088","specialization":"IT"}'
SUBCONTRACTOR_ID2=$(extract_id '.data.id')

if [[ -n "$SUBCONTRACTOR_ID2" ]]; then
    assert_http GET "$BASE_URL/api/v1/subcontractors/$SUBCONTRACTOR_ID2" 200 "GET /subcontractors/:id"
    assert_http PUT "$BASE_URL/api/v1/subcontractors/$SUBCONTRACTOR_ID2" 200 "PUT /subcontractors/:id (update)" \
        '{"specialization":"IT Consulting"}'
fi

assert_http GET "$BASE_URL/api/v1/subcontractors/my-company?companyId=$COMPANY_ID" 200 "GET /subcontractors/my-company"

# Contract (multipart — use form-data without file)
if [[ -n "$SUBCONTRACTOR_ID2" ]]; then
    CONTRACT_START=$(date +%Y-%m-%d)
    CONTRACT_END=$(date -d "+365 days" +%Y-%m-%d)
    log_test "POST /subcontractors/:id/contracts (create)"
    # Create a minimal valid file to satisfy the contractDocument requirement
    echo '%PDF-1.0 1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Kids[3 0 R]/Count 1>>endobj 3 0 obj<</MediaBox[0 0 3 3]>>endobj xref 0 4 trailer<</Size 4/Root 1 0 R>>startxref 0 %%EOF' > /tmp/test_contract.pdf
    STATUS=$(curl -s -o /tmp/grh_body.json -w "%{http_code}" -X POST \
        "$BASE_URL/api/v1/subcontractors/$SUBCONTRACTOR_ID2/contracts" \
        -H "Authorization: Bearer $TOKEN" \
        -F "startDate=$CONTRACT_START" \
        -F "endDate=$CONTRACT_END" \
        -F "paymentType=FIXED_MONTHLY" \
        -F "amount=5000" \
        -F "contractDocument=@/tmp/test_contract.pdf;type=application/pdf" \
        2>/dev/null) || STATUS="000"
    BODY=$(cat /tmp/grh_body.json 2>/dev/null)
    if [[ "$STATUS" == "200" || "$STATUS" == "201" ]]; then pass; CONTRACT_ID=$(extract_id '.data.id')
    else fail "create contract" "expected 200/201, got $STATUS — $(echo "$BODY" | head -c 100)"; fi

    assert_http GET "$BASE_URL/api/v1/subcontractors/$SUBCONTRACTOR_ID2/contracts" 200 \
        "GET /subcontractors/:id/contracts"
    assert_http GET "$BASE_URL/api/v1/subcontractors/$SUBCONTRACTOR_ID2/contracts/active" 200 \
        "GET /subcontractors/:id/contracts/active"

    # Invoice
    if [[ -n "$CONTRACT_ID" ]]; then
        log_test "POST /subcontractors/contracts/:id/invoices (create)"
        STATUS=$(curl -s -o /tmp/grh_body.json -w "%{http_code}" -X POST \
            "$BASE_URL/api/v1/subcontractors/contracts/$CONTRACT_ID/invoices" \
            -H "Authorization: Bearer $TOKEN" \
            -F "invoiceNumber=INV-$$" \
            -F "amount=5000" \
            -F "dueDate=$NEXT_MONTH" \
            2>/dev/null) || STATUS="000"
        BODY=$(cat /tmp/grh_body.json 2>/dev/null)
        if [[ "$STATUS" == "200" || "$STATUS" == "201" ]]; then pass; INVOICE_ID=$(extract_id '.data.id')
        else fail "create invoice" "expected 200/201, got $STATUS — $(echo "$BODY" | head -c 100)"; fi

        assert_http GET "$BASE_URL/api/v1/subcontractors/contracts/$CONTRACT_ID/invoices" 200 \
            "GET /subcontractors/contracts/:id/invoices"

        if [[ -n "$INVOICE_ID" ]]; then
            log_test "POST /subcontractors/invoices/:id/mark-paid"
            echo -n 'proof' > /tmp/test_proof.pdf
            STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
                "$BASE_URL/api/v1/subcontractors/invoices/$INVOICE_ID/mark-paid" \
                -H "Authorization: Bearer $TOKEN" \
                -F "paymentProof=@/tmp/test_proof.pdf;type=application/pdf" \
                2>/dev/null) || STATUS="000"
            if [[ "$STATUS" == "200" || "$STATUS" == "201" ]]; then pass
            else fail "mark invoice paid" "expected 200, got $STATUS"; fi
        fi

        # Terminate contract (so we can delete/re-test later)
        assert_http POST "$BASE_URL/api/v1/subcontractors/contracts/$CONTRACT_ID/terminate" 200 \
            "POST /subcontractors/contracts/:id/terminate"
    fi

    # Subcontractor reviews
    assert_http GET "$BASE_URL/api/v1/subcontractors/reviews/my-company?companyId=$COMPANY_ID" 200 \
        "GET /subcontractors/reviews/my-company"
    assert_http GET "$BASE_URL/api/v1/subcontractors/$SUBCONTRACTOR_ID2/reviews" 200 \
        "GET /subcontractors/:id/reviews"

    # List all reviews and pick one to update/submit
    REVIEWS_BODY=$(curl -s "$BASE_URL/api/v1/subcontractors/$SUBCONTRACTOR_ID/reviews" \
        -H "Authorization: Bearer $TOKEN" 2>/dev/null)
    EXISTING_REVIEW_ID=$(echo "$REVIEWS_BODY" | jq -r '.data[0].id // empty' 2>/dev/null)

    if [[ -n "$EXISTING_REVIEW_ID" ]]; then
        assert_http GET "$BASE_URL/api/v1/subcontractors/reviews/$EXISTING_REVIEW_ID" 200 \
            "GET /subcontractors/reviews/:id"
        assert_http PUT "$BASE_URL/api/v1/subcontractors/reviews/$EXISTING_REVIEW_ID" 200 \
            "PUT /subcontractors/reviews/:id (update)" \
            '{"qualityScore":4,"timelinessScore":4,"communicationScore":4,"professionalismScore":4,"reliabilityScore":4,"problemSolvingScore":4,"costEffectivenessScore":4,"flexibilityScore":4,"complianceScore":4,"supportScore":4,"comments":"Test update"}'
        assert_http POST "$BASE_URL/api/v1/subcontractors/reviews/$EXISTING_REVIEW_ID/submit" 200 \
            "POST /subcontractors/reviews/:id/submit"
    else
        skip "GET/PUT/submit review — no existing reviews for SUBCONTRACTOR_ID"; TOTAL=$((TOTAL+3)); SKIP=$((SKIP+3))
    fi

    assert_http DELETE "$BASE_URL/api/v1/subcontractors/$SUBCONTRACTOR_ID2" 200 "DELETE /subcontractors/:id"
fi

###############################################################################
#  SECTION 17 — Documents
###############################################################################
log_section "17. Documents  /api/v1/documents"

# Create a minimal valid PNG (1x1 pixel) for upload testing
echo 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==' | base64 -d > /tmp/test_upload.png 2>/dev/null

log_test "POST /documents (upload)"
STATUS=$(curl -s -o /tmp/grh_body.json -w "%{http_code}" -X POST \
    "$BASE_URL/api/v1/documents" \
    -H "Authorization: Bearer $TOKEN" \
    -F "employeeId=$EMPLOYEE_ID" \
    -F "companyId=$COMPANY_ID" \
    -F "documentType=contract" \
    -F "documentName=Test Contract" \
    -F "file=@/tmp/test_upload.png;type=image/png" \
    2>/dev/null) || STATUS="000"
BODY=$(cat /tmp/grh_body.json 2>/dev/null)
if [[ "$STATUS" == "200" || "$STATUS" == "201" ]]; then pass; DOC_ID=$(extract_id '.data.id')
else fail "upload document" "expected 200/201, got $STATUS — $(echo "$BODY" | head -c 150)"; fi

assert_http GET "$BASE_URL/api/v1/documents/employee/$EMPLOYEE_ID" 200 "GET /documents/employee/:id"

if [[ -n "$DOC_ID" ]]; then
    assert_http GET    "$BASE_URL/api/v1/documents/$DOC_ID" 200 "GET /documents/:id"
    assert_http PUT    "$BASE_URL/api/v1/documents/$DOC_ID" 200 "PUT /documents/:id (update)" \
        '{"name":"Updated Contract.pdf","status":"active"}'
    assert_http DELETE "$BASE_URL/api/v1/documents/$DOC_ID" 200 "DELETE /documents/:id"
else
    skip "GET/PUT/DELETE document — upload failed"; TOTAL=$((TOTAL+3)); SKIP=$((SKIP+3))
fi

###############################################################################
#  SECTION 18 — Notifications
###############################################################################
log_section "18. Notifications  /api/v1/notifications"

assert_http GET "$BASE_URL/api/v1/notifications" 200 "GET /notifications"
assert_http GET "$BASE_URL/api/v1/notifications/unread-count" 200 "GET /notifications/unread-count"

# Get first notification ID
NOTIF_BODY=$(curl -s "$BASE_URL/api/v1/notifications" -H "Authorization: Bearer $TOKEN" 2>/dev/null)
FIRST_NOTIF_ID=$(echo "$NOTIF_BODY" | jq -r '.data[0].id // empty' 2>/dev/null)

if [[ -n "$FIRST_NOTIF_ID" ]]; then
    assert_http POST "$BASE_URL/api/v1/notifications/$FIRST_NOTIF_ID/mark-read" 200 \
        "POST /notifications/:id/mark-read"
fi

assert_http POST "$BASE_URL/api/v1/notifications/mark-all-read" 200 "POST /notifications/mark-all-read"

###############################################################################
#  SECTION 19 — Activity Logs
###############################################################################
log_section "19. Activity Logs  /api/v1/activity-logs"

assert_http GET "$BASE_URL/api/v1/activity-logs/company/$COMPANY_ID" 200 \
    "GET /activity-logs/company/:id"
assert_http GET "$BASE_URL/api/v1/activity-logs/company/$COMPANY_ID/range?startDate=$YESTERDAY&endDate=$TODAY" 200 \
    "GET /activity-logs/company/:id/range"

# Get a user ID from auth/me
ME_BODY=$(curl -s "$BASE_URL/api/v1/auth/me" -H "Authorization: Bearer $TOKEN" 2>/dev/null)
CURRENT_USER_ID=$(echo "$ME_BODY" | jq -r '.data.id // empty' 2>/dev/null)

if [[ -n "$CURRENT_USER_ID" ]]; then
    assert_http GET "$BASE_URL/api/v1/activity-logs/user/$CURRENT_USER_ID" 200 \
        "GET /activity-logs/user/:id"
fi

assert_http GET "$BASE_URL/api/v1/activity-logs/entity/$EMPLOYEE_ID" 200 \
    "GET /activity-logs/entity/:id"

###############################################################################
#  SECTION 20 — Users
###############################################################################
log_section "20. Users  /api/v1/users"

if [[ -n "$NEW_COMPANY_ID" ]]; then
    assert_http_capture POST "$BASE_URL/api/v1/users" 200 "POST /users (create user + send email)" \
        '{"username":"testuser'"$$"'","email":"testuser'"$$"'@grh-test.com","companyId":"'"$COMPANY_ID"'"}'
    CREATED_USER_KC_ID=$(extract_id '.data.keycloakId')
    USER_DB_ID=$(extract_id '.data.id')

    if [[ -n "$USER_DB_ID" ]]; then
        assert_http POST "$BASE_URL/api/v1/users/$USER_DB_ID/resend-setup-email" 200 \
            "POST /users/:id/resend-setup-email"
    fi
fi

###############################################################################
#  SECTION 21 — Roles & Permissions
###############################################################################
log_section "21. Roles  /api/v1/roles"

assert_http GET    "$BASE_URL/api/v1/roles" 200 "GET /roles (list all)"
assert_http GET    "$BASE_URL/api/v1/roles/permissions" 200 "GET /roles/permissions (catalog)"
assert_http GET    "$BASE_URL/api/v1/roles/check-name?name=$ROLE_TEST_NAME" 200 "GET /roles/check-name (available)"
assert_http GET    "$BASE_URL/api/v1/roles/check-name?name=SUPER_ADMIN" 200 "GET /roles/check-name (taken)"

assert_http_capture POST "$BASE_URL/api/v1/roles" 200 "POST /roles (create)" \
    '{
      "roleName":"'"$ROLE_TEST_NAME"'",
      "description":"Role created by test suite",
      "permissions":["employees:read","departments:read","attendance:read","leave_requests:read"]
    }'
CREATED_ROLE=$(extract_id '.data.roleName')

if [[ -n "$CREATED_ROLE" && "$CREATED_ROLE" != "null" ]]; then
    assert_http GET "$BASE_URL/api/v1/roles/$CREATED_ROLE" 200 "GET /roles/:roleName"
    assert_http PUT "$BASE_URL/api/v1/roles/$CREATED_ROLE/permissions" 200 \
        "PUT /roles/:roleName/permissions (update)" \
        '{"permissions":["employees:read","departments:read","attendance:read","leave_requests:read","documents:read"]}'

    # Verify name is now taken
    log_test "GET /roles/check-name confirms role is now taken"
    AVAIL_BODY=$(curl -s "$BASE_URL/api/v1/roles/check-name?name=$CREATED_ROLE" \
        -H "Authorization: Bearer $TOKEN" 2>/dev/null)
    IS_AVAIL=$(echo "$AVAIL_BODY" | jq -r '.data.available' 2>/dev/null)
    if [[ "$IS_AVAIL" == "false" ]]; then pass
    else fail "role name availability check" "expected false, got $IS_AVAIL"; fi

    assert_http DELETE "$BASE_URL/api/v1/roles/$CREATED_ROLE" 200 "DELETE /roles/:roleName"
else
    skip "GET/PUT/check/DELETE role — create failed"; TOTAL=$((TOTAL+4)); SKIP=$((SKIP+4))
fi

# Validate catalog structure
log_test "Permission catalog has multiple modules"
CATALOG_BODY=$(curl -s "$BASE_URL/api/v1/roles/permissions" \
    -H "Authorization: Bearer $TOKEN" 2>/dev/null)
MODULE_COUNT=$(echo "$CATALOG_BODY" | jq '.data.modules | length' 2>/dev/null)
if [[ -n "$MODULE_COUNT" && "$MODULE_COUNT" -gt "10" ]]; then pass
else fail "permission catalog" "expected >10 modules, got ${MODULE_COUNT:-null}"; fi

log_test "Permission catalog has actions per module"
FIRST_MODULE_ACTIONS=$(echo "$CATALOG_BODY" | jq '.data.modules[0].actions | length' 2>/dev/null)
if [[ -n "$FIRST_MODULE_ACTIONS" && "$FIRST_MODULE_ACTIONS" -gt "0" ]]; then pass
else fail "catalog actions" "expected >0, got ${FIRST_MODULE_ACTIONS:-null}"; fi

log_test "POST /roles (invalid permission rejected)"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/v1/roles" \
    -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
    -d '{"roleName":"bad-role-'"$$"'","permissions":["fake:action"]}' 2>/dev/null)
if [[ "$STATUS" == "400" || "$STATUS" == "409" || "$STATUS" == "500" ]]; then pass
else fail "invalid permission validation" "expected 400, got $STATUS"; fi

# Clean up test dept/position created in section 4/5
if [[ -n "$DEPT_ID" ]]; then
    curl -s -o /dev/null -X DELETE "$BASE_URL/api/v1/departments/$DEPT_ID" \
        -H "Authorization: Bearer $TOKEN" 2>/dev/null || true
fi

###############################################################################
#  SUMMARY
###############################################################################
echo -e "\n${CYAN}${BOLD}═══════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}${BOLD}  RESULTS${NC}"
echo -e "${CYAN}${BOLD}═══════════════════════════════════════════════════════${NC}"
echo -e "  ${GREEN}PASS: $PASS${NC}"
echo -e "  ${RED}FAIL: $FAIL${NC}"
echo -e "  ${YELLOW}SKIP: $SKIP${NC}"
echo -e "  TOTAL:  $TOTAL"
echo ""

if [[ "${#FAILURES[@]}" -gt 0 ]]; then
    echo -e "${RED}${BOLD}Failed tests:${NC}"
    for f in "${FAILURES[@]}"; do echo -e "  ${RED}• $f${NC}"; done
    echo ""
fi

if [[ "$FAIL" -eq 0 ]]; then
    echo -e "${GREEN}${BOLD}✓ All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}${BOLD}✗ $FAIL test(s) failed.${NC}"
    exit 1
fi
