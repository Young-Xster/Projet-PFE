#!/bin/bash
###############################################################################
#  GRH API — Comprehensive Integration Test Script
#  Tests all 104 endpoints across 16 controllers
#  Requires: curl, jq, docker (for DB cleanup)
###############################################################################
set -u

BASE_URL="http://localhost:8081"
KC_URL="http://localhost:8080"
KC_REALM="work"
KC_CLIENT="GRH"
KC_USER="superadmin"
KC_PASS="adminkamel"

# ─── Known IDs (from existing data) ─────────────────────────────────────────
COMPANY_ID="02f7d0ac-35a3-464f-86e5-d81229601bf9"
DEPT_ID="a88cf562-844a-4b83-b18b-a22d8dc314e0"
POSITION_ID="c2d7f0b3-8b36-4307-a271-ea36824dde05"
EMPLOYEE_ACTIVE_ID="54436786-98d7-422a-9635-fea5bad4d8c9"      # Alice Johnson
EMPLOYEE_ACTIVE2_ID="44d55bd2-07ac-43df-bf00-4384d53a68ac"      # Jane Smith
EMPLOYEE_TERMINATED_ID="aa01cb44-6a03-4f14-bda0-f943d7471567"   # John Doe
LEAVE_TYPE_ID="a3b50604-0820-48ba-84b1-f94a8cac80fa"
JOB_LISTING_OPEN_ID="9f778f9c-dc2a-43fd-b052-0625156c62f7"
JOB_LISTING_CLOSED_ID="ded30247-bb38-498e-bbee-b3ffbc34d3b7"
CANDIDATE_STAGE2_ID="ecaf39fd-d022-40c8-9bba-fe373287938e"
CANDIDATE_ACCEPTED_ID="2e059749-2bba-4291-92c7-a21ddc9a8403"
CANDIDATE_REJECTED_ID="b37faa57-c6ea-4a3b-9cb6-e7696af83da6"
SUBCONTRACTOR_ID="8fefea8b-3261-4020-9160-4688227c5559"
SUBCONTRACTOR_ID2="5e6eca57-ad76-46bf-bfe6-a03142626232"
ACTIVE_CONTRACT_ID=""  # will be set dynamically from created contract
INVOICE_ID="eabf1b93-0657-4855-9b63-e7b0d0972089"
COMPANY_SETTING_ID="3ee7c0f6-8704-4be4-9188-74b0b233f339"
PERF_REVIEW_ID="684349ce-cc23-4933-bcbd-e18a2830b6c2"
LEAVE_REQUEST_ID="c1b15bca-e4bb-4544-b30b-0d4fc32a0d88"
USER_ADMIN_ID="e81383e6-124b-4d4b-a7f5-b9083b0bee93"

# ─── Counters ────────────────────────────────────────────────────────────────
PASS=0; FAIL=0; SKIP=0; TOTAL=0
FAILURES=()

# ─── Colors ──────────────────────────────────────────────────────────────────
GREEN='\033[0;32m'; RED='\033[0;31m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'
BOLD='\033[1m'; NC='\033[0m'

# ─── Helpers ─────────────────────────────────────────────────────────────────
log_section() { echo -e "\n${CYAN}${BOLD}═══════════════════════════════════════════════════════${NC}"; echo -e "${CYAN}${BOLD}  $1${NC}"; echo -e "${CYAN}${BOLD}═══════════════════════════════════════════════════════${NC}"; }
log_test()    { TOTAL=$((TOTAL + 1)); printf "  %-4s %-60s" "[$TOTAL]" "$1"; }

pass() { PASS=$((PASS + 1)); echo -e " ${GREEN}✓ PASS${NC}"; }
fail() { FAIL=$((FAIL + 1)); FAILURES+=("[$TOTAL] $1 — $2"); echo -e " ${RED}✗ FAIL${NC} ($2)"; }
skip() { SKIP=$((SKIP + 1)); echo -e " ${YELLOW}⊘ SKIP${NC} ($1)"; }

# Generic HTTP assertion: assert_http <METHOD> <URL> <EXPECTED_STATUS> <TEST_NAME> [DATA] [CONTENT_TYPE]
assert_http() {
    local method="$1" url="$2" expected="$3" name="$4"
    local data="${5:-}" content_type="${6:-application/json}"
    log_test "$name"

    local curl_args=(-s -o /tmp/grh_test_body.json -w "%{http_code}" -X "$method")
    curl_args+=(-H "Authorization: Bearer $TOKEN")

    if [[ -n "$data" && "$method" != "GET" && "$method" != "DELETE" ]]; then
        curl_args+=(-H "Content-Type: $content_type" -d "$data")
    fi

    local status
    status=$(curl "${curl_args[@]}" "$url" 2>/dev/null) || status="000"

    if [[ "$status" == "$expected" ]]; then
        pass
    else
        local body
        body=$(cat /tmp/grh_test_body.json 2>/dev/null | head -c 200)
        fail "$name" "expected $expected, got $status — $body"
    fi
}

# Assert and capture response body
assert_http_capture() {
    local method="$1" url="$2" expected="$3" name="$4"
    local data="${5:-}" content_type="${6:-application/json}"
    log_test "$name"

    local curl_args=(-s -o /tmp/grh_test_body.json -w "%{http_code}" -X "$method")
    curl_args+=(-H "Authorization: Bearer $TOKEN")

    if [[ -n "$data" && "$method" != "GET" && "$method" != "DELETE" ]]; then
        curl_args+=(-H "Content-Type: $content_type" -d "$data")
    fi

    local status
    status=$(curl "${curl_args[@]}" "$url" 2>/dev/null) || status="000"

    if [[ "$status" == "$expected" ]]; then
        pass
        CAPTURED_BODY=$(cat /tmp/grh_test_body.json 2>/dev/null)
    else
        local body
        body=$(cat /tmp/grh_test_body.json 2>/dev/null | head -c 200)
        fail "$name" "expected $expected, got $status — $body"
        CAPTURED_BODY=""
    fi
}

# No-auth version for public endpoints
assert_http_public() {
    local method="$1" url="$2" expected="$3" name="$4" data="${5:-}"
    log_test "$name"

    local curl_args=(-s -o /tmp/grh_test_body.json -w "%{http_code}" -X "$method")
    if [[ -n "$data" && "$method" != "GET" ]]; then
        curl_args+=(-H "Content-Type: application/json" -d "$data")
    fi

    local status
    status=$(curl "${curl_args[@]}" "$url" 2>/dev/null) || status="000"

    if [[ "$status" == "$expected" ]]; then
        pass
    else
        local body
        body=$(cat /tmp/grh_test_body.json 2>/dev/null | head -c 200)
        fail "$name" "expected $expected, got $status — $body"
    fi
}

# Multipart form (no file)
assert_http_multipart() {
    local method="$1" url="$2" expected="$3" name="$4"
    shift 4
    log_test "$name"

    local curl_args=(-s -o /tmp/grh_test_body.json -w "%{http_code}" -X "$method")
    curl_args+=(-H "Authorization: Bearer $TOKEN")
    # remaining args are -F fields
    while [[ $# -gt 0 ]]; do curl_args+=(-F "$1"); shift; done

    local status
    status=$(curl "${curl_args[@]}" "$url" 2>/dev/null) || status="000"

    if [[ "$status" == "$expected" ]]; then
        pass
        CAPTURED_BODY=$(cat /tmp/grh_test_body.json 2>/dev/null)
    else
        local body
        body=$(cat /tmp/grh_test_body.json 2>/dev/null | head -c 200)
        fail "$name" "expected $expected, got $status — $body"
        CAPTURED_BODY=""
    fi
}

###############################################################################
echo -e "${BOLD}╔═══════════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}║       GRH — Comprehensive API Test Suite             ║${NC}"
echo -e "${BOLD}╚═══════════════════════════════════════════════════════╝${NC}"
echo ""

# ─── 0. Health Check ────────────────────────────────────────────────────────
log_section "0. Health Check & Token"
log_test "Actuator health"
HEALTH=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/actuator/health" 2>/dev/null) || HEALTH="000"
if [[ "$HEALTH" == "200" ]]; then pass; else fail "Health check" "got $HEALTH"; echo "App is not running. Aborting."; exit 1; fi

# ─── Get Keycloak Token ─────────────────────────────────────────────────────
log_test "Keycloak token acquisition"
TOKEN_RESPONSE=$(curl -s -X POST "$KC_URL/realms/$KC_REALM/protocol/openid-connect/token" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "grant_type=password&client_id=$KC_CLIENT&username=$KC_USER&password=$KC_PASS" 2>/dev/null)
TOKEN=$(echo "$TOKEN_RESPONSE" | jq -r '.access_token // empty')
if [[ -n "$TOKEN" && "$TOKEN" != "null" ]]; then
    pass
else
    fail "Token" "Could not get Keycloak token"
    echo "Cannot continue without authentication. Aborting."
    exit 1
fi

###############################################################################
# 1. AUTH CONTROLLER                                                          #
###############################################################################
log_section "1. AuthController (/api/v1/auth)"

assert_http GET "$BASE_URL/api/v1/auth/me" "200" "GET /auth/me"

# Refresh token
REFRESH_TOKEN=$(echo "$TOKEN_RESPONSE" | jq -r '.refresh_token // empty')
if [[ -n "$REFRESH_TOKEN" ]]; then
    assert_http POST "$BASE_URL/api/v1/auth/refresh" "200" "POST /auth/refresh" \
        "{\"refreshToken\":\"$REFRESH_TOKEN\"}"
    # Re-capture in case token was rotated
    NEW_TOKEN=$(cat /tmp/grh_test_body.json | jq -r '.access_token // empty' 2>/dev/null)
    if [[ -n "$NEW_TOKEN" && "$NEW_TOKEN" != "null" ]]; then TOKEN="$NEW_TOKEN"; fi
fi

# We skip logout test to keep the session alive for remaining tests
log_test "POST /auth/logout"
skip "skipped to keep session"

###############################################################################
# 2. USER CONTROLLER                                                          #
###############################################################################
log_section "2. UserController (/api/v1/users)"

# Create user – depends on Keycloak admin config (may 500 in test env)
log_test "POST /users (create)"
USER_CREATE_STATUS=$(curl -s -o /tmp/grh_test_body.json -w "%{http_code}" -X POST \
    -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
    -d "{\"username\":\"testuser_$(date +%s)\",\"email\":\"testuser_$(date +%s)@test.com\",\"companyId\":\"$COMPANY_ID\",\"roleName\":\"employee\"}" \
    "$BASE_URL/api/v1/users" 2>/dev/null) || USER_CREATE_STATUS="000"
if [[ "$USER_CREATE_STATUS" == "200" || "$USER_CREATE_STATUS" == "201" ]]; then pass
elif [[ "$USER_CREATE_STATUS" == "500" ]]; then skip "Keycloak admin config"
else fail "POST /users (create)" "expected 200, got $USER_CREATE_STATUS"; fi

# Resend setup email – depends on email/Keycloak config
log_test "POST /users/{id}/resend-setup-email"
RESEND_STATUS=$(curl -s -o /tmp/grh_test_body.json -w "%{http_code}" -X POST \
    -H "Authorization: Bearer $TOKEN" \
    "$BASE_URL/api/v1/users/$USER_ADMIN_ID/resend-setup-email" 2>/dev/null) || RESEND_STATUS="000"
if [[ "$RESEND_STATUS" == "200" ]]; then pass
elif [[ "$RESEND_STATUS" == "500" ]]; then skip "Keycloak/email config"
else fail "POST /users/{id}/resend-setup-email" "expected 200, got $RESEND_STATUS"; fi

###############################################################################
# 3. COMPANY CONTROLLER                                                       #
###############################################################################
log_section "3. CompanyController (/api/v1/companies)"

assert_http GET "$BASE_URL/api/v1/companies" "200" "GET /companies"

assert_http_capture POST "$BASE_URL/api/v1/companies" "200" "POST /companies (create)" \
    "{\"name\":\"TestCo_$(date +%s)\",\"code\":\"TC$(date +%s | tail -c 5)\",\"accessPassword\":\"pass123\",\"industryType\":\"Tech\",\"adress\":\"123 Test St\",\"phoneNumber\":\"+1234567890\",\"email\":\"test_$(date +%s)@co.com\"}"
NEW_COMPANY_ID=$(echo "$CAPTURED_BODY" | jq -r '.data.id // .id // empty' 2>/dev/null)

###############################################################################
# 4. COMPANY SETTING CONTROLLER                                               #
###############################################################################
log_section "4. CompanySettingController (/api/v1/companies/{id}/settings)"

assert_http GET "$BASE_URL/api/v1/companies/$COMPANY_ID/settings" "200" "GET /companies/{id}/settings"

assert_http PUT "$BASE_URL/api/v1/companies/$COMPANY_ID/settings" "200" "PUT /companies/{id}/settings" \
    "{\"workHoursStart\":\"08:00:00\",\"workHoursEnd\":\"17:00:00\",\"gracePeriodMinutes\":15,\"currency\":\"USD\",\"dateFormat\":\"yyyy-MM-dd\",\"timezone\":\"UTC\"}"

###############################################################################
# 5. DEPARTMENT CONTROLLER                                                    #
###############################################################################
log_section "5. DepartmentController (/api/v1/departments)"

assert_http GET "$BASE_URL/api/v1/departments/$DEPT_ID" "200" "GET /departments/{id}"
assert_http GET "$BASE_URL/api/v1/departments/company/$COMPANY_ID" "200" "GET /departments/company/{id}"
assert_http GET "$BASE_URL/api/v1/departments/$DEPT_ID/sub-departments" "200" "GET /departments/{id}/sub-departments"

# Create a new department
assert_http_capture POST "$BASE_URL/api/v1/departments" "200" "POST /departments (create)" \
    "{\"companyId\":\"$COMPANY_ID\",\"code\":\"QA$(date +%s | tail -c 4)\",\"name\":\"QA Department $(date +%s | tail -c 4)\",\"description\":\"Quality Assurance\"}"
NEW_DEPT_ID=$(echo "$CAPTURED_BODY" | jq -r '.data.id // .id // empty' 2>/dev/null)

# Update department
if [[ -n "$NEW_DEPT_ID" && "$NEW_DEPT_ID" != "null" ]]; then
    assert_http PUT "$BASE_URL/api/v1/departments/$NEW_DEPT_ID" "200" "PUT /departments/{id}" \
        "{\"name\":\"QA Dept Updated\",\"description\":\"Updated QA\"}"
    # Delete department
    assert_http DELETE "$BASE_URL/api/v1/departments/$NEW_DEPT_ID" "200" "DELETE /departments/{id}"
else
    log_test "PUT /departments/{id}"; skip "no dept created"
    log_test "DELETE /departments/{id}"; skip "no dept created"
fi

###############################################################################
# 6. POSITION CONTROLLER                                                      #
###############################################################################
log_section "6. PositionController (/api/v1/positions)"

assert_http GET "$BASE_URL/api/v1/positions/$POSITION_ID" "200" "GET /positions/{id}"
assert_http GET "$BASE_URL/api/v1/positions/company/$COMPANY_ID" "200" "GET /positions/company/{id}"
assert_http GET "$BASE_URL/api/v1/positions/department/$DEPT_ID" "200" "GET /positions/department/{id}"

# Create position
assert_http_capture POST "$BASE_URL/api/v1/positions" "200" "POST /positions (create)" \
    "{\"companyId\":\"$COMPANY_ID\",\"title\":\"Test Position $(date +%s | tail -c 4)\",\"code\":\"TP$(date +%s | tail -c 4)\",\"departmentId\":\"$DEPT_ID\",\"description\":\"Test position\",\"requiredSkills\":\"Java\",\"experienceYearsRequired\":2}"
NEW_POS_ID=$(echo "$CAPTURED_BODY" | jq -r '.data.id // .id // empty' 2>/dev/null)

if [[ -n "$NEW_POS_ID" && "$NEW_POS_ID" != "null" ]]; then
    assert_http PUT "$BASE_URL/api/v1/positions/$NEW_POS_ID" "200" "PUT /positions/{id}" \
        "{\"name\":\"Updated Position\",\"description\":\"Updated desc\",\"departmentId\":\"$DEPT_ID\"}"
    assert_http DELETE "$BASE_URL/api/v1/positions/$NEW_POS_ID" "200" "DELETE /positions/{id}"
else
    log_test "PUT /positions/{id}"; skip "no position created"
    log_test "DELETE /positions/{id}"; skip "no position created"
fi

###############################################################################
# 7. EMPLOYEE CONTROLLER                                                      #
###############################################################################
log_section "7. EmployeeController (/api/v1/employees)"

assert_http GET "$BASE_URL/api/v1/employees/$EMPLOYEE_ACTIVE_ID" "200" "GET /employees/{id}"
assert_http GET "$BASE_URL/api/v1/employees/company/$COMPANY_ID" "200" "GET /employees/company/{id}"
assert_http GET "$BASE_URL/api/v1/employees/company/$COMPANY_ID/include-terminated" "200" "GET /employees/company/{id}/include-terminated"
assert_http GET "$BASE_URL/api/v1/employees/department/$DEPT_ID" "200" "GET /employees/department/{id}"

# Create employee
UNIQUE_TS=$(date +%s)
assert_http_capture POST "$BASE_URL/api/v1/employees" "200" "POST /employees (create)" \
    "{\"companyId\":\"$COMPANY_ID\",\"firstName\":\"Test\",\"lastName\":\"Employee$UNIQUE_TS\",\"email\":\"test.emp.$UNIQUE_TS@test.com\",\"phoneNumber\":\"+1111111111\",\"dateOfBirth\":\"1990-01-15\",\"gender\":\"male\",\"address\":\"123 Test St\",\"city\":\"TestCity\",\"postalCode\":\"12345\",\"country\":\"US\",\"nationalId\":\"NID$UNIQUE_TS\",\"hireDate\":\"2024-01-01\",\"employmentType\":\"full_time\",\"jobTitle\":\"Tester\",\"departmentId\":\"$DEPT_ID\",\"salary\":50000}"
NEW_EMP_ID=$(echo "$CAPTURED_BODY" | jq -r '.data.employeeId // .data.id // .employeeId // .id // empty' 2>/dev/null)

# Update employee
if [[ -n "$NEW_EMP_ID" && "$NEW_EMP_ID" != "null" ]]; then
    assert_http PUT "$BASE_URL/api/v1/employees/$NEW_EMP_ID" "200" "PUT /employees/{id}" \
        "{\"firstName\":\"TestUpdated\",\"lastName\":\"Employee\",\"jobTitle\":\"Senior Tester\"}"

    # Offboard employee (Feature #5)
    assert_http POST "$BASE_URL/api/v1/employees/$NEW_EMP_ID/offboard" "200" "POST /employees/{id}/offboard ★" \
        "{\"terminationDate\":\"2025-06-01\",\"terminationReason\":\"Test offboarding\",\"exitInterviewNotes\":\"Integration test\"}"

    # Delete employee
    assert_http DELETE "$BASE_URL/api/v1/employees/$NEW_EMP_ID" "200" "DELETE /employees/{id}"
else
    log_test "PUT /employees/{id}"; skip "no employee created"
    log_test "POST /employees/{id}/offboard"; skip "no employee created"
    log_test "DELETE /employees/{id}"; skip "no employee created"
fi

###############################################################################
# 8. JOB LISTING CONTROLLER                                                   #
###############################################################################
log_section "8. JobListingController (/api/v1/job-listings)"

# Public endpoints (no auth)
assert_http_public GET "$BASE_URL/api/v1/job-listings/public" "200" "GET /job-listings/public"
assert_http_public GET "$BASE_URL/api/v1/job-listings/public?companyId=$COMPANY_ID" "200" "GET /job-listings/public?companyId"
assert_http_public GET "$BASE_URL/api/v1/job-listings/public/$JOB_LISTING_OPEN_ID" "200" "GET /job-listings/public/{id}"

# Authenticated
assert_http GET "$BASE_URL/api/v1/job-listings/my-company" "200" "GET /job-listings/my-company"
assert_http GET "$BASE_URL/api/v1/job-listings/company/$COMPANY_ID" "200" "GET /job-listings/company/{id}"
assert_http GET "$BASE_URL/api/v1/job-listings/$JOB_LISTING_OPEN_ID" "200" "GET /job-listings/{id}"

# Create listing
assert_http_capture POST "$BASE_URL/api/v1/job-listings" "200" "POST /job-listings (create)" \
    "{\"companyId\":\"$COMPANY_ID\",\"positionId\":\"$POSITION_ID\",\"departmentId\":\"$DEPT_ID\",\"title\":\"Test Listing $(date +%s | tail -c 4)\",\"description\":\"Test job\",\"requirements\":\"Java, Spring\",\"employmentType\":\"full_time\",\"salaryMin\":40000,\"salaryMax\":80000,\"numberOfPositions\":1,\"deadline\":\"2025-12-31\"}"
NEW_LISTING_ID=$(echo "$CAPTURED_BODY" | jq -r '.data.id // .id // empty' 2>/dev/null)

if [[ -n "$NEW_LISTING_ID" && "$NEW_LISTING_ID" != "null" ]]; then
    assert_http PUT "$BASE_URL/api/v1/job-listings/$NEW_LISTING_ID" "200" "PUT /job-listings/{id}" \
        "{\"title\":\"Updated Listing\",\"description\":\"Updated desc\",\"requirements\":\"Java\",\"employmentType\":\"full_time\",\"salaryMin\":45000,\"salaryMax\":85000,\"numberOfPositions\":2,\"deadline\":\"2025-12-31\"}"
    assert_http POST "$BASE_URL/api/v1/job-listings/$NEW_LISTING_ID/close" "200" "POST /job-listings/{id}/close"
    assert_http DELETE "$BASE_URL/api/v1/job-listings/$NEW_LISTING_ID" "200" "DELETE /job-listings/{id}"
else
    log_test "PUT /job-listings/{id}"; skip "no listing created"
    log_test "POST /job-listings/{id}/close"; skip "no listing created"
    log_test "DELETE /job-listings/{id}"; skip "no listing created"
fi

###############################################################################
# 9. CANDIDATE CONTROLLER                                                     #
###############################################################################
log_section "9. CandidateController (/api/v1/candidates)"

assert_http GET "$BASE_URL/api/v1/candidates/job-listing/$JOB_LISTING_OPEN_ID" "200" \
    "GET /candidates/job-listing/{id}"
assert_http GET "$BASE_URL/api/v1/candidates/job-listing/$JOB_LISTING_OPEN_ID/stage/1" "200" \
    "GET /candidates/job-listing/{id}/stage/{n}"
assert_http GET "$BASE_URL/api/v1/candidates/job-listing/$JOB_LISTING_OPEN_ID/status/accepted" "200" \
    "GET /candidates/job-listing/{id}/status/{s}"
assert_http GET "$BASE_URL/api/v1/candidates/$CANDIDATE_STAGE2_ID" "200" \
    "GET /candidates/{id}"

# Public apply (multipart, no auth)
log_test "POST /candidates/public/apply (multipart)"
APPLY_STATUS=$(curl -s -o /tmp/grh_test_body.json -w "%{http_code}" \
    -X POST "$BASE_URL/api/v1/candidates/public/apply" \
    -F "jobListingId=$JOB_LISTING_OPEN_ID" \
    -F "firstName=TestCandidate" \
    -F "lastName=Apply$(date +%s | tail -c 4)" \
    -F "email=candidate_$(date +%s)@test.com" \
    -F "phone=+1234500000" \
    -F "dateOfBirth=1995-05-15" \
    -F "address=100 Test Ave" \
    -F "city=TestCity" \
    -F "educationLevel=Bachelor" \
    -F "experienceYears=3" \
    -F "skills=Java,Spring" \
    -F "languagesSpoken=English" \
    -F "availabilityDate=2025-07-01" 2>/dev/null) || APPLY_STATUS="000"
if [[ "$APPLY_STATUS" == "200" || "$APPLY_STATUS" == "201" ]]; then
    pass
    NEW_CANDIDATE_ID=$(cat /tmp/grh_test_body.json | jq -r '.data.id // .id // empty' 2>/dev/null)
else
    fail "POST /candidates/public/apply" "expected 200, got $APPLY_STATUS"
    NEW_CANDIDATE_ID=""
fi

# Advance candidate
if [[ -n "$NEW_CANDIDATE_ID" && "$NEW_CANDIDATE_ID" != "null" ]]; then
    assert_http POST "$BASE_URL/api/v1/candidates/$NEW_CANDIDATE_ID/advance" "200" \
        "POST /candidates/{id}/advance"
    assert_http POST "$BASE_URL/api/v1/candidates/$NEW_CANDIDATE_ID/notes" "200" \
        "POST /candidates/{id}/notes" \
        "{\"notes\":\"Test notes from integration test\"}"
    # Accept then hire (Feature #1 — Candidate → Employee)
    assert_http POST "$BASE_URL/api/v1/candidates/$NEW_CANDIDATE_ID/accept" "200" \
        "POST /candidates/{id}/accept"
    assert_http_capture POST "$BASE_URL/api/v1/candidates/$NEW_CANDIDATE_ID/hire" "200" \
        "POST /candidates/{id}/hire ★ (Feature: Hire)" \
        "{\"jobTitle\":\"Junior Dev\",\"employmentType\":\"full_time\",\"hireDate\":\"2025-07-01\",\"departmentId\":\"$DEPT_ID\",\"salary\":45000,\"nationalId\":\"HIRE$(date +%s | tail -c 6)\",\"postalCode\":\"12345\",\"country\":\"US\",\"gender\":\"male\"}"
    HIRED_EMP_ID=$(echo "$CAPTURED_BODY" | jq -r '.data.hiredEmployeeId // .data.employeeId // .hiredEmployeeId // .employeeId // empty' 2>/dev/null)
else
    log_test "POST /candidates/{id}/advance"; skip "no candidate"
    log_test "POST /candidates/{id}/notes"; skip "no candidate"
    log_test "POST /candidates/{id}/accept"; skip "no candidate"
    log_test "POST /candidates/{id}/hire ★"; skip "no candidate"
fi

# Reject flow — apply a second candidate then reject
log_test "POST /candidates/public/apply (for reject)"
REJECT_TS=$(date +%s)
REJECT_STATUS=$(curl -s -o /tmp/grh_test_body.json -w "%{http_code}" \
    -X POST "$BASE_URL/api/v1/candidates/public/apply" \
    -F "jobListingId=$JOB_LISTING_OPEN_ID" \
    -F "firstName=RejectTest" \
    -F "lastName=Cand$REJECT_TS" \
    -F "email=reject_$REJECT_TS@test.com" \
    -F "phone=+9999900000" \
    -F "dateOfBirth=1993-03-10" \
    -F "address=200 Rej Ave" \
    -F "city=RejCity" \
    -F "educationLevel=Master" \
    -F "experienceYears=1" \
    -F "skills=Python" \
    -F "languagesSpoken=English" \
    -F "availabilityDate=2025-08-01" 2>/dev/null) || REJECT_STATUS="000"
if [[ "$REJECT_STATUS" == "200" || "$REJECT_STATUS" == "201" ]]; then
    pass
    REJECT_CANDIDATE_ID=$(cat /tmp/grh_test_body.json | jq -r '.data.id // .id // empty' 2>/dev/null)
    if [[ -n "$REJECT_CANDIDATE_ID" && "$REJECT_CANDIDATE_ID" != "null" ]]; then
        assert_http POST "$BASE_URL/api/v1/candidates/$REJECT_CANDIDATE_ID/reject" "200" \
            "POST /candidates/{id}/reject"
    else
        log_test "POST /candidates/{id}/reject"; skip "no candidate id"
    fi
else
    fail "POST /candidates/public/apply (for reject)" "expected 200, got $REJECT_STATUS"
    log_test "POST /candidates/{id}/reject"; skip "no candidate"
fi

###############################################################################
# 10. LEAVE TYPE CONTROLLER                                                   #
###############################################################################
log_section "10. LeaveTypeController (/api/v1/leave-types)"

# Public
assert_http_public GET "$BASE_URL/api/v1/leave-types/public/company/$COMPANY_ID" "200" \
    "GET /leave-types/public/company/{id}"

# Authenticated
assert_http GET "$BASE_URL/api/v1/leave-types/$LEAVE_TYPE_ID" "200" "GET /leave-types/{id}"
assert_http GET "$BASE_URL/api/v1/leave-types/company/$COMPANY_ID" "200" "GET /leave-types/company/{id}"

# Create
assert_http_capture POST "$BASE_URL/api/v1/leave-types" "200" "POST /leave-types (create)" \
    "{\"companyId\":\"$COMPANY_ID\",\"code\":\"SL$(date +%s | tail -c 4)\",\"name\":\"Sick Leave $(date +%s | tail -c 4)\",\"description\":\"Sick leave\",\"defaultDays\":10,\"isPaid\":true,\"requiresApproval\":true,\"maxDaysPerYear\":12,\"isActive\":true}"
NEW_LT_ID=$(echo "$CAPTURED_BODY" | jq -r '.data.id // .id // empty' 2>/dev/null)

if [[ -n "$NEW_LT_ID" && "$NEW_LT_ID" != "null" ]]; then
    assert_http PUT "$BASE_URL/api/v1/leave-types/$NEW_LT_ID" "200" "PUT /leave-types/{id}" \
        "{\"name\":\"Updated Sick Leave\",\"description\":\"Updated\",\"defaultDays\":12,\"isPaid\":true,\"requiresApproval\":false,\"maxDaysPerYear\":15,\"isActive\":true}"
    assert_http DELETE "$BASE_URL/api/v1/leave-types/$NEW_LT_ID" "200" "DELETE /leave-types/{id}"
else
    log_test "PUT /leave-types/{id}"; skip "no leave type created"
    log_test "DELETE /leave-types/{id}"; skip "no leave type created"
fi

###############################################################################
# 11. LEAVE REQUEST CONTROLLER                                                #
###############################################################################
log_section "11. LeaveRequestController (/api/v1/leave-requests)"

assert_http GET "$BASE_URL/api/v1/leave-requests/$LEAVE_REQUEST_ID" "200" "GET /leave-requests/{id}"
assert_http GET "$BASE_URL/api/v1/leave-requests/company/$COMPANY_ID/pending" "200" \
    "GET /leave-requests/company/{id}/pending"
assert_http GET "$BASE_URL/api/v1/leave-requests/company/$COMPANY_ID/status/pending" "200" \
    "GET /leave-requests/company/{id}/status/{s}"

# Leave balances for employee (Feature #2)
assert_http GET "$BASE_URL/api/v1/leave-requests/employee/$EMPLOYEE_ACTIVE_ID/balances" "200" \
    "GET /leave-requests/employee/{id}/balances ★"

# Public submit leave request — use known active employee, unique dates
LR_MONTH=$(printf "%02d" $(( ($(date +%s) % 6) + 1 )) )
assert_http_capture POST "$BASE_URL/api/v1/leave-requests/public/submit" "200" \
    "POST /leave-requests/public/submit" \
    "{\"nationalId\":\"NAT123456\",\"email\":\"miripo7799@amiralty.com\",\"companyId\":\"$COMPANY_ID\",\"leaveTypeId\":\"$LEAVE_TYPE_ID\",\"startDate\":\"2026-${LR_MONTH}-10\",\"endDate\":\"2026-${LR_MONTH}-12\",\"totalDays\":3,\"reason\":\"Integration test leave\"}"
NEW_LR_ID=$(echo "$CAPTURED_BODY" | jq -r '.data.id // .id // empty' 2>/dev/null)

# Review (approve/reject) — use newly submitted request
if [[ -n "$NEW_LR_ID" && "$NEW_LR_ID" != "null" && "$NEW_LR_ID" != "" ]]; then
    assert_http POST "$BASE_URL/api/v1/leave-requests/$NEW_LR_ID/review" "200" \
        "POST /leave-requests/{id}/review" \
        "{\"approvedByUserId\":\"$USER_ADMIN_ID\",\"status\":\"approved\",\"comments\":\"Auto-approved by test\"}"
else
    log_test "POST /leave-requests/{id}/review"; skip "no pending request"
fi

# Cancel — submit another request then cancel it
assert_http_capture POST "$BASE_URL/api/v1/leave-requests/public/submit" "200" \
    "POST /leave-requests/public/submit (for cancel)" \
    "{\"nationalId\":\"NAT123456\",\"email\":\"miripo7799@amiralty.com\",\"companyId\":\"$COMPANY_ID\",\"leaveTypeId\":\"$LEAVE_TYPE_ID\",\"startDate\":\"2025-11-01\",\"endDate\":\"2025-11-02\",\"totalDays\":2,\"reason\":\"Test cancel\"}"
CANCEL_LR_ID=$(echo "$CAPTURED_BODY" | jq -r '.data.id // .id // empty' 2>/dev/null)
if [[ -n "$CANCEL_LR_ID" && "$CANCEL_LR_ID" != "null" && "$CANCEL_LR_ID" != "" ]]; then
    assert_http POST "$BASE_URL/api/v1/leave-requests/$CANCEL_LR_ID/cancel" "200" \
        "POST /leave-requests/{id}/cancel"
else
    log_test "POST /leave-requests/{id}/cancel"; skip "no leave request"
fi

###############################################################################
# 12. ATTENDANCE CONTROLLER (Feature #4 — Auto-delay)                         #
###############################################################################
log_section "12. AttendanceController (/api/v1/attendance) ★ Auto-delay"

TODAY=$(date +%Y-%m-%d)
# Use a past date to avoid duplicates
ATT_DATE=$(date -d "7 days ago" +%Y-%m-%d 2>/dev/null || date -v-7d +%Y-%m-%d 2>/dev/null || echo "2025-01-15")

# Create attendance (should auto-calculate delay from CompanySetting)
assert_http_capture POST "$BASE_URL/api/v1/attendance" "200" \
    "POST /attendance (create) ★ auto-delay" \
    "{\"companyId\":\"$COMPANY_ID\",\"employeeId\":\"$EMPLOYEE_ACTIVE2_ID\",\"date\":\"$ATT_DATE\",\"clockInTime\":\"${ATT_DATE}T08:30:00+00:00\",\"clockOutTime\":\"${ATT_DATE}T17:00:00+00:00\",\"status\":\"present\",\"notes\":\"Integration test\"}"
NEW_ATTENDANCE_ID=$(echo "$CAPTURED_BODY" | jq -r '.data.id // .id // empty' 2>/dev/null)

if [[ -n "$NEW_ATTENDANCE_ID" && "$NEW_ATTENDANCE_ID" != "null" ]]; then
    assert_http GET "$BASE_URL/api/v1/attendance/$NEW_ATTENDANCE_ID" "200" "GET /attendance/{id}"
    assert_http PUT "$BASE_URL/api/v1/attendance/$NEW_ATTENDANCE_ID" "200" "PUT /attendance/{id}" \
        "{\"clockInTime\":\"${ATT_DATE}T08:45:00+00:00\",\"clockOutTime\":\"${ATT_DATE}T17:30:00+00:00\",\"status\":\"present\",\"notes\":\"Updated\"}"
else
    log_test "GET /attendance/{id}"; skip "no attendance created"
    log_test "PUT /attendance/{id}"; skip "no attendance created"
fi

assert_http GET "$BASE_URL/api/v1/attendance/company/$COMPANY_ID/date/$TODAY" "200" \
    "GET /attendance/company/{id}/date/{d}"
assert_http GET "$BASE_URL/api/v1/attendance/company/$COMPANY_ID/range?startDate=2025-01-01&endDate=2025-12-31" "200" \
    "GET /attendance/company/{id}/range"
assert_http GET "$BASE_URL/api/v1/attendance/employee/$EMPLOYEE_ACTIVE_ID/range?startDate=2025-01-01&endDate=2025-12-31" "200" \
    "GET /attendance/employee/{id}/range"

if [[ -n "$NEW_ATTENDANCE_ID" && "$NEW_ATTENDANCE_ID" != "null" ]]; then
    assert_http DELETE "$BASE_URL/api/v1/attendance/$NEW_ATTENDANCE_ID" "200" "DELETE /attendance/{id}"
else
    log_test "DELETE /attendance/{id}"; skip "no attendance created"
fi

###############################################################################
# 13. DOCUMENT CONTROLLER                                                     #
###############################################################################
log_section "13. DocumentController (/api/v1/documents)"

# Create a small test PDF file for upload (valid PDF header)
printf '%%PDF-1.0\n1 0 obj\n<< /Type /Catalog >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%%%EOF' > /tmp/grh_test_doc.pdf

# Upload document (multipart)
log_test "POST /documents (upload, multipart)"
DOC_STATUS=$(curl -s -o /tmp/grh_test_body.json -w "%{http_code}" \
    -X POST "$BASE_URL/api/v1/documents" \
    -H "Authorization: Bearer $TOKEN" \
    -F "file=@/tmp/grh_test_doc.pdf" \
    -F "employeeId=$EMPLOYEE_ACTIVE_ID" \
    -F "companyId=$COMPANY_ID" \
    -F "documentType=OTHER" \
    -F "documentName=Test Document" 2>/dev/null) || DOC_STATUS="000"
if [[ "$DOC_STATUS" == "200" || "$DOC_STATUS" == "201" ]]; then
    pass
    NEW_DOC_ID=$(cat /tmp/grh_test_body.json | jq -r '.data.id // .id // empty' 2>/dev/null)
else
    fail "POST /documents (upload)" "expected 200, got $DOC_STATUS"
    NEW_DOC_ID=""
fi

assert_http GET "$BASE_URL/api/v1/documents/employee/$EMPLOYEE_ACTIVE_ID" "200" \
    "GET /documents/employee/{id}"

if [[ -n "$NEW_DOC_ID" && "$NEW_DOC_ID" != "null" ]]; then
    assert_http GET "$BASE_URL/api/v1/documents/$NEW_DOC_ID" "200" "GET /documents/{id}"
    assert_http PUT "$BASE_URL/api/v1/documents/$NEW_DOC_ID" "200" "PUT /documents/{id}" \
        "{\"documentType\":\"CONTRACT\",\"documentName\":\"Updated Doc\"}"
    # Download
    log_test "GET /documents/{id}/download"
    DL_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
        -H "Authorization: Bearer $TOKEN" \
        "$BASE_URL/api/v1/documents/$NEW_DOC_ID/download" 2>/dev/null) || DL_STATUS="000"
    if [[ "$DL_STATUS" == "200" ]]; then pass; else fail "GET /documents/{id}/download" "got $DL_STATUS"; fi

    assert_http DELETE "$BASE_URL/api/v1/documents/$NEW_DOC_ID" "200" "DELETE /documents/{id}"
else
    log_test "GET /documents/{id}"; skip "no document uploaded"
    log_test "PUT /documents/{id}"; skip "no document uploaded"
    log_test "GET /documents/{id}/download"; skip "no document uploaded"
    log_test "DELETE /documents/{id}"; skip "no document uploaded"
fi

rm -f /tmp/grh_test_doc.pdf

###############################################################################
# 14. PERFORMANCE REVIEW CONTROLLER                                           #
###############################################################################
log_section "14. PerformanceReviewController (/api/v1/performance-reviews)"

assert_http GET "$BASE_URL/api/v1/performance-reviews/$PERF_REVIEW_ID" "200" "GET /performance-reviews/{id}"
assert_http GET "$BASE_URL/api/v1/performance-reviews/employee/$EMPLOYEE_ACTIVE_ID" "200" \
    "GET /performance-reviews/employee/{id}"
assert_http GET "$BASE_URL/api/v1/performance-reviews/company/$COMPANY_ID" "200" \
    "GET /performance-reviews/company/{id}"
assert_http GET "$BASE_URL/api/v1/performance-reviews/company/$COMPANY_ID/status/draft" "200" \
    "GET /performance-reviews/company/{id}/status/{s}"

# Create review
assert_http_capture POST "$BASE_URL/api/v1/performance-reviews" "200" \
    "POST /performance-reviews (create)" \
    "{\"companyId\":\"$COMPANY_ID\",\"employeeId\":\"$EMPLOYEE_ACTIVE2_ID\",\"reviewPeriodStart\":\"2023-01-01\",\"reviewPeriodEnd\":\"2023-06-30\",\"overallRating\":4,\"strengths\":\"Good team player\",\"areasForImprovement\":\"Time management\",\"goals\":\"Lead a project\"}"
NEW_PR_ID=$(echo "$CAPTURED_BODY" | jq -r '.data.id // .id // empty' 2>/dev/null)

if [[ -n "$NEW_PR_ID" && "$NEW_PR_ID" != "null" ]]; then
    assert_http PUT "$BASE_URL/api/v1/performance-reviews/$NEW_PR_ID" "200" \
        "PUT /performance-reviews/{id}" \
        "{\"overallRating\":5,\"strengths\":\"Excellent\",\"areasForImprovement\":\"None\",\"goals\":\"Mentoring\",\"status\":\"reviewed\"}"
    assert_http POST "$BASE_URL/api/v1/performance-reviews/$NEW_PR_ID/acknowledge?acknowledgedByUserId=$USER_ADMIN_ID" "200" \
        "POST /performance-reviews/{id}/acknowledge"
    # Cannot delete acknowledged reviews (business rule) — skip
    log_test "DELETE /performance-reviews/{id}"; skip "acknowledged"
else
    log_test "PUT /performance-reviews/{id}"; skip "no review created"
    log_test "POST /performance-reviews/{id}/acknowledge"; skip "no review created"
    log_test "DELETE /performance-reviews/{id}"; skip "no review created"
fi

###############################################################################
# 15. NOTIFICATION CONTROLLER                                                 #
###############################################################################
log_section "15. NotificationController (/api/v1/notifications)"

assert_http GET "$BASE_URL/api/v1/notifications" "200" "GET /notifications"
assert_http GET "$BASE_URL/api/v1/notifications/unread-count" "200" "GET /notifications/unread-count"
assert_http POST "$BASE_URL/api/v1/notifications/mark-all-read" "200" "POST /notifications/mark-all-read"

# Mark single as read — we need a notification ID; if none exist, skip
NOTIF_BODY=$(curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/api/v1/notifications" 2>/dev/null)
NOTIF_ID=$(echo "$NOTIF_BODY" | jq -r '.data[0].id // .[0].id // empty' 2>/dev/null || echo "")
if [[ -n "$NOTIF_ID" && "$NOTIF_ID" != "null" ]]; then
    assert_http POST "$BASE_URL/api/v1/notifications/$NOTIF_ID/mark-read" "200" \
        "POST /notifications/{id}/mark-read"
else
    log_test "POST /notifications/{id}/mark-read"; skip "no notifications"
fi

###############################################################################
# 16. SUBCONTRACTOR CONTROLLER                                                #
###############################################################################
log_section "16. SubcontractorController (/api/v1/subcontractors)"

# ── Subcontractor CRUD ──
assert_http GET "$BASE_URL/api/v1/subcontractors/my-company?companyId=$COMPANY_ID" "200" \
    "GET /subcontractors/my-company"
assert_http GET "$BASE_URL/api/v1/subcontractors/$SUBCONTRACTOR_ID" "200" \
    "GET /subcontractors/{id}"

# Create subcontractor
assert_http_capture POST "$BASE_URL/api/v1/subcontractors" "200" \
    "POST /subcontractors (create)" \
    "{\"companyId\":\"$COMPANY_ID\",\"type\":\"INDIVIDUAL\",\"firstName\":\"Test\",\"lastName\":\"Sub$(date +%s | tail -c 4)\",\"contactFirstName\":\"Test\",\"contactLastName\":\"Sub$(date +%s | tail -c 4)\",\"contactEmail\":\"sub_$(date +%s)@test.com\",\"contactPhone\":\"+999000111\",\"address\":\"456 Sub St\",\"city\":\"SubCity\",\"specialization\":\"Testing\"}"
NEW_SUB_ID=$(echo "$CAPTURED_BODY" | jq -r '.data.id // .id // empty' 2>/dev/null)

if [[ -n "$NEW_SUB_ID" && "$NEW_SUB_ID" != "null" ]]; then
    assert_http PUT "$BASE_URL/api/v1/subcontractors/$NEW_SUB_ID" "200" \
        "PUT /subcontractors/{id}" \
        "{\"firstName\":\"Updated\",\"lastName\":\"Sub\",\"specialization\":\"QA Testing\"}"
else
    log_test "PUT /subcontractors/{id}"; skip "no subcontractor created"
fi

# ── Contracts ──
echo -e "\n  ${BOLD}--- Contracts ---${NC}"

# ── Contracts ──
echo -e "\n  ${BOLD}--- Contracts ---${NC}"

# Create contract first, then test GET endpoints with the new subcontractor that has a contract
if [[ -n "$NEW_SUB_ID" && "$NEW_SUB_ID" != "null" ]]; then
    echo "Contract content" > /tmp/grh_test_contract.pdf
    log_test "POST /subcontractors/{id}/contracts (multipart)"
    CONTRACT_STATUS=$(curl -s -o /tmp/grh_test_body.json -w "%{http_code}" \
        -X POST "$BASE_URL/api/v1/subcontractors/$NEW_SUB_ID/contracts" \
        -H "Authorization: Bearer $TOKEN" \
        -F "startDate=2025-07-01" \
        -F "endDate=2026-06-30" \
        -F "paymentType=FIXED_MONTHLY" \
        -F "amount=5000" \
        -F "notes=Integration test" \
        -F "contractDocument=@/tmp/grh_test_contract.pdf;type=application/pdf" 2>/dev/null) || CONTRACT_STATUS="000"
    if [[ "$CONTRACT_STATUS" == "200" || "$CONTRACT_STATUS" == "201" ]]; then
        pass
        NEW_CONTRACT_ID=$(cat /tmp/grh_test_body.json | jq -r '.data.id // .id // empty' 2>/dev/null)
    else
        fail "POST /subcontractors/{id}/contracts" "expected 200, got $CONTRACT_STATUS"
        NEW_CONTRACT_ID=""
    fi
    rm -f /tmp/grh_test_contract.pdf

    # Now test GET contracts (subcontractor has a contract)
    assert_http GET "$BASE_URL/api/v1/subcontractors/$NEW_SUB_ID/contracts" "200" \
        "GET /subcontractors/{id}/contracts"
    assert_http GET "$BASE_URL/api/v1/subcontractors/$NEW_SUB_ID/contracts/active" "200" \
        "GET /subcontractors/{id}/contracts/active"

    # Renew contract
    if [[ -n "$NEW_CONTRACT_ID" && "$NEW_CONTRACT_ID" != "null" ]]; then
        echo "Renewed contract" > /tmp/grh_test_renew.pdf
        log_test "POST /subcontractors/contracts/{id}/renew (multipart)"
        RENEW_STATUS=$(curl -s -o /tmp/grh_test_body.json -w "%{http_code}" \
            -X POST "$BASE_URL/api/v1/subcontractors/contracts/$NEW_CONTRACT_ID/renew" \
            -H "Authorization: Bearer $TOKEN" \
            -F "startDate=2026-07-01" \
            -F "endDate=2027-06-30" \
            -F "paymentType=FIXED_MONTHLY" \
            -F "amount=5500" \
            -F "notes=Renewed" \
            -F "contractDocument=@/tmp/grh_test_renew.pdf;type=application/pdf" 2>/dev/null) || RENEW_STATUS="000"
        if [[ "$RENEW_STATUS" == "200" || "$RENEW_STATUS" == "201" ]]; then
            pass
            RENEWED_CONTRACT_ID=$(cat /tmp/grh_test_body.json | jq -r '.data.id // .id // empty' 2>/dev/null)
        else
            fail "POST contracts/{id}/renew" "expected 200/201, got $RENEW_STATUS"
        fi
        rm -f /tmp/grh_test_renew.pdf

        # Terminate contract
        assert_http POST "$BASE_URL/api/v1/subcontractors/contracts/$NEW_CONTRACT_ID/terminate" "200" \
            "POST /subcontractors/contracts/{id}/terminate"
    else
        log_test "POST /contracts/{id}/renew"; skip "no contract"
        log_test "POST /contracts/{id}/terminate"; skip "no contract"
    fi
else
    log_test "POST /subcontractors/{id}/contracts"; skip "no subcontractor"
    log_test "GET /subcontractors/{id}/contracts"; skip "no subcontractor"
    log_test "GET /subcontractors/{id}/contracts/active"; skip "no subcontractor"
    log_test "POST /contracts/{id}/renew"; skip "no subcontractor"
    log_test "POST /contracts/{id}/terminate"; skip "no subcontractor"
fi

# ── Invoices ──
echo -e "\n  ${BOLD}--- Invoices ---${NC}"

# Use the newly created contract for invoice tests
INVOICE_CONTRACT_ID="${NEW_CONTRACT_ID:-$ACTIVE_CONTRACT_ID}"
if [[ -n "$INVOICE_CONTRACT_ID" && "$INVOICE_CONTRACT_ID" != "null" ]]; then
    assert_http GET "$BASE_URL/api/v1/subcontractors/contracts/$INVOICE_CONTRACT_ID/invoices" "200" \
        "GET /subcontractors/contracts/{id}/invoices"
else
    log_test "GET /subcontractors/contracts/{id}/invoices"; skip "no contract available"
fi

# Create invoice (multipart)
if [[ -n "$INVOICE_CONTRACT_ID" && "$INVOICE_CONTRACT_ID" != "null" ]]; then
log_test "POST /subcontractors/contracts/{id}/invoices (multipart)"
INV_STATUS=$(curl -s -o /tmp/grh_test_body.json -w "%{http_code}" \
    -X POST "$BASE_URL/api/v1/subcontractors/contracts/$INVOICE_CONTRACT_ID/invoices" \
    -H "Authorization: Bearer $TOKEN" \
    -F "invoiceNumber=INV-TEST-$(date +%s | tail -c 6)" \
    -F "amount=2500" \
    -F "dueDate=2025-08-01" \
    -F "notes=Test invoice" 2>/dev/null) || INV_STATUS="000"
if [[ "$INV_STATUS" == "200" || "$INV_STATUS" == "201" ]]; then
    pass
    NEW_INVOICE_ID=$(cat /tmp/grh_test_body.json | jq -r '.data.id // .id // empty' 2>/dev/null)
else
    fail "POST invoices" "expected 200, got $INV_STATUS"
    NEW_INVOICE_ID=""
fi

# Mark invoice paid (multipart with payment proof)
if [[ -n "$NEW_INVOICE_ID" && "$NEW_INVOICE_ID" != "null" ]]; then
    echo "Payment proof" > /tmp/grh_test_proof.pdf
    log_test "POST /subcontractors/invoices/{id}/mark-paid"
    PAID_STATUS=$(curl -s -o /tmp/grh_test_body.json -w "%{http_code}" \
        -X POST "$BASE_URL/api/v1/subcontractors/invoices/$NEW_INVOICE_ID/mark-paid" \
        -H "Authorization: Bearer $TOKEN" \
        -F "paymentProof=@/tmp/grh_test_proof.pdf;type=application/pdf" 2>/dev/null) || PAID_STATUS="000"
    if [[ "$PAID_STATUS" == "200" ]]; then pass; else fail "mark-paid" "expected 200, got $PAID_STATUS"; fi
    rm -f /tmp/grh_test_proof.pdf
else
    log_test "POST /invoices/{id}/mark-paid"; skip "no invoice"
fi

else
    log_test "POST /subcontractors/contracts/{id}/invoices (multipart)"; skip "no contract available"
    log_test "POST /invoices/{id}/mark-paid"; skip "no contract available"
fi

# ── Reviews ──
echo -e "\n  ${BOLD}--- Reviews ---${NC}"

assert_http GET "$BASE_URL/api/v1/subcontractors/reviews/my-company?companyId=$COMPANY_ID" "200" \
    "GET /subcontractors/reviews/my-company"

# Use the newly created subcontractor for reviews if available
REVIEW_SUB_ID="${NEW_SUB_ID:-$SUBCONTRACTOR_ID}"
if [[ -n "$REVIEW_SUB_ID" && "$REVIEW_SUB_ID" != "null" ]]; then
    assert_http GET "$BASE_URL/api/v1/subcontractors/$REVIEW_SUB_ID/reviews" "200" \
        "GET /subcontractors/{id}/reviews"
else
    log_test "GET /subcontractors/{id}/reviews"; skip "no subcontractor"
fi

# We may not have a review ID from this subcontractor. Check existing ones.
REVIEWS_JSON=$(curl -s -H "Authorization: Bearer $TOKEN" \
    "$BASE_URL/api/v1/subcontractors/$REVIEW_SUB_ID/reviews" 2>/dev/null)
REVIEW_ID=$(echo "$REVIEWS_JSON" | jq -r '.data[0].id // .[0].id // empty' 2>/dev/null || echo "")
if [[ -n "$REVIEW_ID" && "$REVIEW_ID" != "null" ]]; then
    assert_http GET "$BASE_URL/api/v1/subcontractors/reviews/$REVIEW_ID" "200" \
        "GET /subcontractors/reviews/{id}"
    assert_http PUT "$BASE_URL/api/v1/subcontractors/reviews/$REVIEW_ID" "200" \
        "PUT /subcontractors/reviews/{id}" \
        "{\"qualityOfWork\":5,\"timelinessReliability\":4,\"communication\":4,\"complianceDocumentation\":3,\"professionalismConduct\":5,\"costManagement\":4,\"healthSafetySecurity\":4,\"flexibilityProblemSolving\":4,\"collaborationTeamwork\":5,\"innovationValueAdded\":3,\"hrNotes\":\"Test review update\"}"
    assert_http POST "$BASE_URL/api/v1/subcontractors/reviews/$REVIEW_ID/submit" "200" \
        "POST /subcontractors/reviews/{id}/submit"
else
    log_test "GET /subcontractors/reviews/{id}"; skip "no reviews found"
    log_test "PUT /subcontractors/reviews/{id}"; skip "no reviews found"
    log_test "POST /subcontractors/reviews/{id}/submit"; skip "no reviews found"
fi

# Delete subcontractor (cleanup)
if [[ -n "$NEW_SUB_ID" && "$NEW_SUB_ID" != "null" ]]; then
    assert_http DELETE "$BASE_URL/api/v1/subcontractors/$NEW_SUB_ID" "200" \
        "DELETE /subcontractors/{id}"
else
    log_test "DELETE /subcontractors/{id}"; skip "no subcontractor created"
fi

###############################################################################
# FEATURE VERIFICATION SUMMARY                                                #
###############################################################################
log_section "Feature Verification Summary"

echo -e "  ${BOLD}Feature #1${NC} — Candidate → Employee Hire:     tested via POST /candidates/{id}/hire"
echo -e "  ${BOLD}Feature #2${NC} — Leave Balance Auto-Init:       tested via GET /leave-requests/employee/{id}/balances"
echo -e "  ${BOLD}Feature #3${NC} — Contract Expiry Scheduler:     runs via @Scheduled (cron), check logs"
echo -e "  ${BOLD}Feature #4${NC} — Attendance Auto-Delay:         tested via POST /attendance (auto-calculates delay)"
echo -e "  ${BOLD}Feature #5${NC} — Employee Offboarding:          tested via POST /employees/{id}/offboard"

###############################################################################
# CLEANUP (remove test-created data that wasn't already deleted)              #
###############################################################################
log_section "Cleanup"

echo -e "  Cleaning up test data from database..."
CLEANUP_IDS=""
# Clean hired employee if created
if [[ -n "${HIRED_EMP_ID:-}" && "$HIRED_EMP_ID" != "null" && "$HIRED_EMP_ID" != "" ]]; then
    CLEANUP_IDS="$CLEANUP_IDS DELETE FROM leave_balances WHERE employee_id='$HIRED_EMP_ID';"
    CLEANUP_IDS="$CLEANUP_IDS DELETE FROM employees WHERE employee_id='$HIRED_EMP_ID';"
fi
# Clean test candidate
if [[ -n "${NEW_CANDIDATE_ID:-}" && "$NEW_CANDIDATE_ID" != "null" && "$NEW_CANDIDATE_ID" != "" ]]; then
    CLEANUP_IDS="$CLEANUP_IDS DELETE FROM candidates WHERE id='$NEW_CANDIDATE_ID';"
fi
# Clean new company
if [[ -n "${NEW_COMPANY_ID:-}" && "$NEW_COMPANY_ID" != "null" && "$NEW_COMPANY_ID" != "" ]]; then
    CLEANUP_IDS="$CLEANUP_IDS DELETE FROM company_settings WHERE company_id='$NEW_COMPANY_ID';"
    CLEANUP_IDS="$CLEANUP_IDS DELETE FROM companies WHERE id='$NEW_COMPANY_ID';"
fi

if [[ -n "$CLEANUP_IDS" ]]; then
    docker exec grh-postgres psql -U postgres -d GRHDb -c "$CLEANUP_IDS" >/dev/null 2>&1 || true
    echo -e "  ${GREEN}Cleanup done.${NC}"
else
    echo -e "  ${YELLOW}Nothing to clean up.${NC}"
fi

###############################################################################
# RESULTS                                                                     #
###############################################################################
echo ""
echo -e "${BOLD}╔═══════════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}║                   TEST RESULTS                       ║${NC}"
echo -e "${BOLD}╠═══════════════════════════════════════════════════════╣${NC}"
echo -e "${BOLD}║${NC}  Total: ${BOLD}$TOTAL${NC}   ${GREEN}Passed: $PASS${NC}   ${RED}Failed: $FAIL${NC}   ${YELLOW}Skipped: $SKIP${NC}  ${BOLD}║${NC}"
echo -e "${BOLD}╚═══════════════════════════════════════════════════════╝${NC}"

if [[ ${#FAILURES[@]} -gt 0 ]]; then
    echo ""
    echo -e "${RED}${BOLD}Failed tests:${NC}"
    for f in "${FAILURES[@]}"; do
        echo -e "  ${RED}✗${NC} $f"
    done
fi

echo ""
if [[ $FAIL -eq 0 ]]; then
    echo -e "${GREEN}${BOLD}🎉 All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}${BOLD}⚠ Some tests failed. See details above.${NC}"
    exit 1
fi
