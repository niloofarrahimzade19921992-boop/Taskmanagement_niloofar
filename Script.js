/* =========================================================
   TASK MANAGEMENT SYSTEM
   JavaScript
   ========================================================= */


/* ================= PAGE NAVIGATION ================= */

const menuItems = document.querySelectorAll(".menu-item[data-section]");
const sections = document.querySelectorAll(".page-section");
const goButtons = document.querySelectorAll("[data-go]");


function showSection(sectionId) {

    sections.forEach(section => {
        section.classList.remove("active");
    });

    menuItems.forEach(item => {
        item.classList.remove("active");
    });

    const target = document.getElementById(sectionId);

    if (target) {
        target.classList.add("active");
    }

    const activeMenu = document.querySelector(
        `.menu-item[data-section="${sectionId}"]`
    );

    if (activeMenu) {
        activeMenu.classList.add("active");
    }

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


menuItems.forEach(item => {

    item.addEventListener("click", () => {

        const sectionId = item.dataset.section;

        showSection(sectionId);

    });

});


goButtons.forEach(button => {

    button.addEventListener("click", () => {

        const sectionId = button.dataset.go;

        showSection(sectionId);

    });

});


/* ================= TOAST ================= */

const toast = document.getElementById("toast");

function showToast(message) {

    if (!toast) return;

    toast.querySelector("p").textContent = message;

    toast.classList.add("show");

    setTimeout(() => {
        toast.classList.remove("show");
    }, 3000);
}


/* ================= PROJECT CREATION ================= */

const createProjectBtn = document.getElementById("createProjectBtn");

if (createProjectBtn) {

    createProjectBtn.addEventListener("click", () => {

        const title = document.getElementById("projectTitle");

        if (!title.value.trim()) {

            showToast("لطفاً عنوان پروژه را وارد کنید.");

            title.focus();

            return;
        }

        showToast("پروژه با موفقیت ایجاد شد.");

        title.value = "";

    });

}


/* ================= TASK CREATION ================= */

const createTaskBtn = document.getElementById("createTaskBtn");

if (createTaskBtn) {

    createTaskBtn.addEventListener("click", () => {

        const title = document.getElementById("taskTitle");

        if (!title.value.trim()) {

            showToast("لطفاً عنوان وظیفه را وارد کنید.");

            title.focus();

            return;
        }

        showToast("وظیفه جدید با موفقیت ثبت شد.");

        title.value = "";

    });

}


/* ================= JALALI DATE ================= */

const jalaliInputs = document.querySelectorAll(".jalali-input");


jalaliInputs.forEach(input => {

    input.addEventListener("input", function () {

        let value = this.value;

        value = value.replace(/[^\d۰-۹/]/g, "");

        const persianNumbers = "۰۱۲۳۴۵۶۷۸۹";

        const englishNumbers = "0123456789";

        value = value.replace(/[۰-۹]/g, function (number) {

            return englishNumbers[persianNumbers.indexOf(number)];

        });

        this.value = value;

    });


    input.addEventListener("blur", function () {

        const value = this.value;

        if (!value) return;

        const pattern = /^(13|14)\d{2}\/\d{1,2}\/\d{1,2}$/;

        if (!pattern.test(value)) {

            showToast("تاریخ را به شکل ۱۴۰۵/۰۸/۲۰ وارد کنید.");

            this.focus();

        }

    });

});


/* ================= TASK SEARCH ================= */

const taskSearch = document.getElementById("taskSearch");

const taskFilter = document.getElementById("taskFilter");

const taskRows = document.querySelectorAll("#taskTable tbody tr");


function filterTasks() {

    const searchValue =
        taskSearch.value.trim().toLowerCase();

    const filterValue =
        taskFilter.value;


    taskRows.forEach(row => {

        const text =
            row.textContent.toLowerCase();

        const status =
            row.dataset.status;


        const searchMatch =
            text.includes(searchValue);


        const filterMatch =
            filterValue === "all" ||
            status === filterValue;


        if (searchMatch && filterMatch) {

            row.style.display = "";

        } else {

            row.style.display = "none";

        }

    });

}


if (taskSearch) {

    taskSearch.addEventListener(
        "input",
        filterTasks
    );

}


if (taskFilter) {

    taskFilter.addEventListener(
        "change",
        filterTasks
    );

}


/* ================= APPROVAL BUTTONS ================= */

const approveButtons =
    document.querySelectorAll(".approve");


const rejectButtons =
    document.querySelectorAll(".reject");


approveButtons.forEach(button => {

    button.addEventListener("click", () => {

        const card =
            button.closest(".approval-card");

        if (card) {

            card.style.opacity = "0.5";

            button.disabled = true;

            showToast("مورد با موفقیت تأیید شد.");

        }

    });

});


rejectButtons.forEach(button => {

    button.addEventListener("click", () => {

        const card =
            button.closest(".approval-card");

        if (card) {

            card.style.opacity = "0.5";

            button.disabled = true;

            showToast("مورد رد شد.");

        }

    });

});


/* =========================================================
   CHARTS
   ========================================================= */


/* Chart Global Settings */

Chart.defaults.font.family = "Vazirmatn";

Chart.defaults.font.size = 11;

Chart.defaults.color = "#657b8d";


/* ================= PERFORMANCE LINE ================= */

const performanceCanvas =
    document.getElementById("performanceChart");


if (performanceCanvas) {

    new Chart(performanceCanvas, {

        type: "line",

        data: {

            labels: [
                "خرداد",
                "تیر",
                "مرداد",
                "شهریور",
                "مهر",
                "آبان"
            ],

            datasets: [

                {
                    label: "درصد پیشرفت",
                    data: [42, 51, 58, 66, 73, 79],

                    borderColor: "#2787d7",

                    backgroundColor:
                        "rgba(39,135,215,.14)",

                    fill: true,

                    tension: .45,

                    pointRadius: 5,

                    pointHoverRadius: 7
                },

                {
                    label: "هدف برنامه",
                    data: [40, 48, 55, 62, 70, 76],

                    borderColor: "#1bb486",

                    backgroundColor:
                        "rgba(27,180,134,.04)",

                    borderDash: [6, 5],

                    fill: false,

                    tension: .35,

                    pointRadius: 3
                }

            ]

        },

        options: {

            responsive: true,

            maintainAspectRatio: false,

            plugins: {

                legend: {
                    position: "bottom"
                }

            },

            scales: {

                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        callback: value => value + "%"
                    }
                }

            }

        }

    });

}


/* ================= TASK STATUS DOUGHNUT ================= */

const taskStatusCanvas =
    document.getElementById("taskStatusChart");


if (taskStatusCanvas) {

    new Chart(taskStatusCanvas, {

        type: "doughnut",

        data: {

            labels: [
                "انجام‌شده",
                "در حال انجام",
                "در انتظار",
                "لغوشده"
            ],

            datasets: [{

                data: [78, 34, 11, 5],

                backgroundColor: [
                    "#20b77d",
                    "#3284dc",
                    "#f2a33f",
                    "#df5d68"
                ],

                borderWidth: 3,

                borderColor: "#ffffff",

                hoverOffset: 10

            }]

        },

        options: {

            responsive: true,

            maintainAspectRatio: false,

            cutout: "64%",

            plugins: {

                legend: {
                    display: false
                }

            }

        }

    });

}


/* ================= PROJECT TYPE ================= */

const projectTypeCanvas =
    document.getElementById("projectTypeChart");


if (projectTypeCanvas) {

    new Chart(projectTypeCanvas, {

        type: "polarArea",

        data: {

            labels: [
                "فناوری اطلاعات",
                "منابع انسانی",
                "مالی",
                "پشتیبانی",
                "برنامه‌ریزی"
            ],

            datasets: [{

                data: [8, 5, 4, 3, 4],

                backgroundColor: [
                    "rgba(49,132,216,.75)",
                    "rgba(117,85,215,.75)",
                    "rgba(24,170,137,.75)",
                    "rgba(242,158,55,.75)",
                    "rgba(220,88,102,.75)"
                ],

                borderColor: "#fff",

                borderWidth: 2

            }]

        },

        options: {

            responsive: true,

            maintainAspectRatio: false,

            plugins: {

                legend: {
                    position: "bottom"
                }

            },

            scales: {

                r: {
                    ticks: {
                        display: false
                    }

                }

            }

        }

    });

}


/* ================= MONTHLY BAR ================= */

const monthlyTaskCanvas =
    document.getElementById("monthlyTaskChart");


if (monthlyTaskCanvas) {

    new Chart(monthlyTaskCanvas, {

        type: "bar",

        data: {

            labels: [
                "فروردین",
                "اردیبهشت",
                "خرداد",
                "تیر",
                "مرداد",
                "شهریور",
                "مهر",
                "آبان"
            ],

            datasets: [

                {
                    label: "ایجاد شده",
                    data: [18, 23, 29, 34, 39, 42, 48, 55],

                    backgroundColor: "#3285d8",

                    borderRadius: 7
                },

                {
                    label: "انجام شده",
                    data: [11, 17, 21, 25, 31, 35, 39, 44],

                    backgroundColor: "#20b57d",

                    borderRadius: 7
                }

            ]

        },

        options: {

            responsive: true,

            maintainAspectRatio: false,

            plugins: {

                legend: {
                    position: "bottom"
                }

            },

            scales: {

                y: {
                    beginAtZero: true
                }

            }

        }

    });

}


/* ================= PRIORITY ================= */

const priorityCanvas =
    document.getElementById("priorityChart");


if (priorityCanvas) {

    new Chart(priorityCanvas, {

        type: "doughnut",

        data: {

            labels: [
                "زیاد",
                "متوسط",
                "کم"
            ],

            datasets: [{

                data: [27, 58, 43],

                backgroundColor: [
                    "#e15c68",
                    "#f1a23c",
                    "#22ad79"
                ],

                borderWidth: 3,

                borderColor: "#fff",

                hoverOffset: 8

            }]

        },

        options: {

            responsive: true,

            maintainAspectRatio: false,

            cutout: "58%",

            plugins: {

                legend: {
                    position: "bottom"
                }

            }

        }

    });

}


/* ================= DEPARTMENT ================= */

const departmentCanvas =
    document.getElementById("departmentChart");


if (departmentCanvas) {

    new Chart(departmentCanvas, {

        type: "bar",

        data: {

            labels: [
                "فناوری",
                "مالی",
                "منابع انسانی",
                "پشتیبانی",
                "برنامه‌ریزی"
            ],

            datasets: [{

                label: "درصد عملکرد",

                data: [91, 84, 76, 88, 69],

                backgroundColor: [
                    "#3184d8",
                    "#20ae7c",
                    "#7658d3",
                    "#f0a03d",
                    "#dd5d68"
                ],

                borderRadius: 9

            }]

        },

        options: {

            indexAxis: "y",

            responsive: true,

            maintainAspectRatio: false,

            plugins: {

                legend: {
                    display: false
                }

            },

            scales: {

                x: {
                    beginAtZero: true,
                    max: 100,

                    ticks: {
                        callback: value => value + "%"
                    }

                }

            }

        }

    });

}


/* ================= LOGOUT ================= */

const logoutBtn =
    document.getElementById("logoutBtn");


if (logoutBtn) {

    logoutBtn.addEventListener("click", () => {

        const confirmed =
            confirm("آیا می‌خواهید از سامانه خارج شوید؟");

        if (confirmed) {

            showToast("خروج از سامانه انجام شد.");

        }

    });

}


/* ================= FILTER BUTTON ================= */

const filterButton =
    document.querySelector(".filter-btn");


if (filterButton) {

    filterButton.addEventListener("click", () => {

        showToast(
            "فیلتر گزارشات در نسخه عملیاتی قابل تنظیم است."
        );

    });

}


/* ================= FILE UPLOAD ================= */

const fileInput =
    document.querySelector(".upload-box input");


if (fileInput) {

    fileInput.addEventListener("change", () => {

        if (fileInput.files.length > 0) {

            const fileName =
                fileInput.files[0].name;

            showToast(
                "فایل «" + fileName + "» انتخاب شد."
            );

        }

    });

}


/* ================= START ================= */

console.log(
    "Task Management System loaded successfully."
);
