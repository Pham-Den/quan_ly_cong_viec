*** Settings ***
Documentation     Biến trong này dược dùng chung cho cả web và app,
Variables    ../../Variables/ENV_${ENV}.yaml    # Đỏ thì kệ đỏ :))


*** Variables ***
${RUNNING_ON_JENKIN}    N
${CLOSE_BROWSER}    Y
${OTP}            123456
${UPDATE_TEST_CASE}    N
${UNINSTALL_APP}    N
${RESPONSE}       ${EMPTY}
${TESTCYCLES}     ${EMPTY}
${timeout}        30s
${dbName}         b2bauto
${dbUsername}     admin    # admin
${dbPassword}     <YOUR_DB_PASSWORD>
${dbHost}         <YOUR_DB_HOST>
${dbPort}         3306
${dbCharset}      utf8
${channel}        AAQAKROfGhA
${mention}        mention
${team}           ${empty}
${PIPELINE_CODE}    ${EMPTY}
${RUN_BROWSER}    chrome
${ENV}    QC
${auth}    <YOUR_TEST_AUTH>
${ApiKeyMember}    <YOUR_API_KEY>
${API_REPORT}    https://your-report-api.example.com
