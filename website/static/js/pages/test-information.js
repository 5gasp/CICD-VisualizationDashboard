/**
 * @Author: Rafael Direito
 * @Date:   2025-08-12 22:25:34
 * @Last Modified by:   Rafael Direito
 * @Last Modified time: 2025-08-12 22:49:03
 */
// On Load, load CUs
var test_id;
var access_token;
window.onload = function () {
    checkLogin();
    test_id = findGetParameter("test_id");
    access_token = findGetParameter("access_token");
    if (test_id == null) test_id = getCookie('test_id');
    if (access_token == null) access_token = getCookie('access_token');
    get_test_base_info();
    get_test_process_stages();
    get_tests_performed();
    get_test_logs_and_metrics();
};

function logout() {
    deleteCookie("access_token");
    deleteCookie("test_id");
    // redirecting
    navigateTo(pages.index);
}

function refresh_results() {
    get_test_process_stages();
    get_tests_performed()
}

setInterval(refresh_results, 10000);

let num_test_process_stages = 0;
let num_performed_tests = 0;


function get_test_base_info() {
    $.ajax({
        type: "GET",
        url: rest_api.test_base_info,
        data: {
            "test_id": test_id,
            "access_token": access_token,
        },
    })
        .done(function (response) {
            if (response.success) {
                $("#base_info_test_id").text(response.data.test_id);
                $("#base_info_netapp_id").text(response.data.netapp_id);
                $("#base_info_network_service_id").text(response.data.network_service_id);
                $("#base_info_testbed").text(response.data.testbed_id);
                $("#base_info_start_time").text(response.data.started_at.split(".")[0]);
                if (response.data.test_status)
                    $("#base_info_test_passed").show();
                else
                    $("#base_info_test_failed").show();
                return true;
            }
            else {
                alert("Error!")
            }
        })
        .fail(function () {
            alert("Error!")
        });

    return false;
}


function get_test_process_stages() {
    $.ajax({
        type: "GET",
        url: rest_api.test_stage_status,
        data: {
            "test_id": test_id,
            "access_token": access_token,
        },
    })
        .done(function (response) {
            if (response.success) {
                if (response.data.length != num_test_process_stages) {
                    $("#testing_process_status_tbody").empty();
                    for (let status of response.data) {
                        add_process_stage_row("#testing_process_status_tbody", status.timestamp, status.state, status.success)
                    }
                    num_test_process_stages = response.data.length
                }
                return true;
            }
            else {
                alert("Error!")
            }
        })
        .fail(function () {
            alert("Error!")
        });

    return false;
}


function get_tests_performed() {
    $.ajax({
        type: "GET",
        url: rest_api.tests_performed,
        data: {
            "test_id": test_id,
            "access_token": access_token,
        },
    })
        .done(function (response) {
            if (response.success) {
                if (response.data.length != num_performed_tests) {
                    $("#tests_performed_tbody").empty();


                    response.data.sort(function (a, b) {
                        var aID = parseInt(a.performed_test.split("-test-id-")[1]);
                        var bID = parseInt(b.performed_test.split("-test-id-")[1]);
                        console.log(aID, bID);
                        // Compare the 2 dates
                        if (aID < bID) return -1;
                        if (aID > bID) return 1;
                        return 0;
                    });

                    for (let test_performed of response.data) {
                        add_test_performed_row("#tests_performed_tbody", test_performed.performed_test, test_performed.description, test_performed.start_time, test_performed.end_time, test_performed.success)
                    }
                    num_performed_tests = response.data.length
                }
                return true;
            }
            else {
                alert("Error!")
            }
        })
        .fail(function () {
            alert("Error!")
        });

    return false;
}

function add_process_stage_row(table_id, timestamp, stage_name, success) {
    let timestamp_splitted = timestamp.split("T");
    let date = timestamp_splitted[0]
    let time = timestamp_splitted[1].split(".")[0]
    stage_name = stage_name.toLowerCase();

    let row = `<tr>
        <td>${date}<br>${time}</td>
        <td>${stage_name}</td>
    `
    if (success)
        row += `
        <td class="td_success">Success</td>
        <td>No Observations</td>
        `;
    else
        row += `<td class="td_fail">Fail</td>
        <td><a href="${pages.console_log}" target="_blank">Get Console Log</a></td>`;

    row += '</tr>'
    $(table_id).append(row);
}


function get_test_logs_and_metrics() {
    $.ajax({
        type: "GET",
        url: rest_api.logs_and_metrics,
        data: {
            "test_id": test_id
        },
    })
        .done(function (response) {
            if (response.success) {
                if (response.data.length != num_test_process_stages) {
                    $("#metrics_collected_tbody").empty();
                    $("#logs_collected_tbody").empty();
                    for (let metric of response.data["metrics"]) {
                        let row = `<tr>
                            <td class="col-8"> <a target="_blank"
                            href="${metric.url}">
                            ${metric.url}</a>
                            </td>
                            <td class="col-2">${metric.access_username}</td>
                            <td class="col-2">${metric.access_password}</td>
                        '</tr>'`;
                        row += '</tr>'
                        $("#metrics_collected_tbody").append(row);
                    }
                    for (let log of response.data["logs"]) {
                        let row = `<tr>
                            <td class="col-8"> <a target="_blank"
                            href="${log.url}">
                            ${log.url}</a>
                            </td>
                            <td class="col-2">${log.access_username}</td>
                            <td class="col-2">${log.access_password}</td>
                        '</tr>'`;
                        row += '</tr>'
                        $("#logs_collected_tbody").append(row);
                    }
                }
                return true;
            }
            else {
                alert("Error!")
            }
        })
        .fail(function () {
            alert("Error!")
        });

    return false;
}



function add_test_performed_row(table_id, test_name, description, start, end, success) {

    let id = test_name.split("-test-id-")[1]
    let test_name_simple = test_name.split("-test-id-")[0]

    if (success == null) {
        start = end = ["-", ""];
    }
    else {
        start = start.split(" ");
        end = end.split(" ");
    }

    let row = `<tr>
        <td>${id}</td>
        <td>${test_name_simple}</td>
        <td>${start[0]}<br>${start[1]}</td>
        <td>${end[0]}<br>${end[1]}</td>
    `
    if (success == null) {
        row += `<td class="td_not_executed">Not Executed</td>`;
        row += `<td>${description}</td>`;
        row += `<td class="td_not_executed_soft">No Test Log</td>`;
        row += `<td class="td_not_executed_soft">No Test Report</td>`;
    } else {
        if (success) {
            row += `<td class="td_success">Passed</td>`;
        } else {
            row += `<td class="td_fail">Failed</td>`;
        }
        row += `<td>${description}</td>`;
        row += `<td><a href="${rest_api.test_files}?file_name=log.html&test_id=${test_id}&test_name=${test_name}&access_token=${access_token}" target="_blank">Test Log</a></td>`;
        row += `<td><a href="${rest_api.test_files}?file_name=report.html&test_id=${test_id}&test_name=${test_name}&access_token=${access_token}" target="_blank">Test Report</a></td>`;

    }


    row += '</tr>'
    $(table_id).append(row);
}



function toTitleCase(str) {
    return str.replace(/\w\S*/g, function (txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
}

