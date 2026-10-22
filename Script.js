// ===============================
// Task Management System
// JavaScript
// ===============================

// -------------------------------
// عناصر اصلی صفحه
// -------------------------------

const navItems = document.querySelectorAll(".nav-item");
const sections = document.querySelectorAll(".page-section");


// -------------------------------
// جابه‌جایی بین بخش‌های سامانه
// -------------------------------

navItems.forEach(item => {

    item.addEventListener("click", function () {

        const target = this.getAttribute("data-section");

        // حذف حالت فعال از منوها
        navItems.forEach(nav => {
            nav.classList.remove("active");
        });

        // فعال کردن منوی انتخاب‌شده
        this.classList.add("active");

        // مخفی کردن همه بخش‌ها
        sections.forEach(section => {
            section.classList.remove("active");
        });

        // نمایش بخش انتخاب‌شده
        const targetSection = document.getElementById(target);

        if (targetSection) {
            targetSection.classList.add("active");
        }

    });

});


// -------------------------------
// باز و بسته شدن منوی موبایل
// -------------------------------

const menuButton = document.querySelector(".menu-button");
const sidebar = document.querySelector(".sidebar");

if (menuButton) {

    menuButton.addEventListener("click", function () {

        sidebar.classList.toggle("open");

    });

}


// -------------------------------
// ایجاد پروژه
// -------------------------------

const projectForm = document.getElementById("projectForm");

if (projectForm) {

    projectForm.addEventListener("submit", function (event) {

        event.preventDefault();

        const title = document.getElementById("projectTitle").value;
        const description = document.getElementById("projectDescription").value;

        if (title.trim() === "") {

            alert("لطفاً عنوان پروژه را وارد کنید.");

            return;
        }

        alert("پروژه با موفقیت ایجاد شد.");

        projectForm.reset();

    });

}


// -------------------------------
// ایجاد وظیفه
// -------------------------------

const taskForm = document.getElementById("taskForm");

if (taskForm) {

    taskForm.addEventListener("submit", function (event) {

        event.preventDefault();

        const taskTitle = document.getElementById("taskTitle").value;
        const taskDescription =
            document.getElementById("taskDescription").value;

        if (taskTitle.trim() === "") {

            alert("لطفاً عنوان وظیفه را وارد کنید.");

            return;
        }

        alert("وظیفه با موفقیت ثبت شد.");

        taskForm.reset();

    });

}


// -------------------------------
// وضعیت وظایف
// -------------------------------

const statusButtons = document.querySelectorAll(".status-filter");

statusButtons.forEach(button => {

    button.addEventListener("click", function () {

        statusButtons.forEach(btn => {
            btn.classList.remove("active");
        });

        this.classList.add("active");

    });

});


// -------------------------------
// جستجوی وظایف
// -------------------------------

const searchInput = document.getElementById("taskSearch");

if (searchInput) {

    searchInput.addEventListener("input", function () {

        const searchValue = this.value.toLowerCase();

        const taskRows = document.querySelectorAll(".task-row");

        taskRows.forEach(row => {

            const rowText = row.innerText.toLowerCase();

            if (rowText.includes(searchValue)) {
                row.style.display = "";
            } else {
                row.style.display = "none";
            }

        });

    });

}


// -------------------------------
// انتخاب وضعیت وظیفه
// -------------------------------

const statusSelect = document.getElementById("taskStatus");

if (statusSelect) {

    statusSelect.addEventListener("change", function () {

        const selectedStatus = this.value;

        console.log("وضعیت انتخاب‌شده:", selectedStatus);

    });

}


// -------------------------------
// تأیید وظیفه
// -------------------------------

const approveButtons = document.querySelectorAll(".approve-btn");

approveButtons.forEach(button => {

    button.addEventListener("click", function () {

        const confirmation = confirm(
            "آیا از تأیید این وظیفه اطمینان دارید؟"
        );

        if (confirmation) {

            const row = this.closest(".task-row");

            if (row) {

                const status = row.querySelector(".task-status");

                if (status) {
                    status.innerText = "تأیید شده";
                }

            }

            alert("وظیفه با موفقیت تأیید شد.");

        }

    });

});


// -------------------------------
// رد وظیفه
// -------------------------------

const rejectButtons = document.querySelectorAll(".reject-btn");

rejectButtons.forEach(button => {

    button.addEventListener("click", function () {

        const confirmation = confirm(
            "آیا می‌خواهید این وظیفه را رد کنید؟"
        );

        if (confirmation) {

            const row = this.closest(".task-row");

            if (row) {

                const status = row.querySelector(".task-status");

                if (status) {
                    status.innerText = "رد شده";
                }

            }

            alert("وظیفه رد شد.");

        }

    });

});


// -------------------------------
// نمایش تاریخ شمسی
// -------------------------------

function getPersianDate() {

    const today = new Date();

    const persianDate = new Intl.DateTimeFormat(
        "fa-IR-u-ca-persian",
        {
            year: "numeric",
            month: "2-digit",
            day: "2-digit"
        }
    ).format(today);

    return persianDate;

}


// -------------------------------
// قرار دادن تاریخ شمسی در داشبورد
// -------------------------------

const currentDate = document.getElementById("currentDate");

if (currentDate) {

    currentDate.innerText = getPersianDate();

}


// -------------------------------
// تقویم شمسی برای فیلدهای تاریخ
// -------------------------------

const dateInputs = document.querySelectorAll(".persian-date");

dateInputs.forEach(input => {

    input.addEventListener("focus", function () {

        this.setAttribute("placeholder", "مثلاً ۱۴۰۵/۰۸/۰۱");

    });

});


// -------------------------------
// بستن منوی موبایل بعد از انتخاب
// -------------------------------

navItems.forEach(item => {

    item.addEventListener("click", function () {

        if (window.innerWidth <= 768) {

            sidebar.classList.remove("open");

        }

    });

});


// -------------------------------
// نمایش پیام خوش‌آمدگویی
// -------------------------------

const welcomeMessage = document.getElementById("welcomeMessage");

if (welcomeMessage) {

    welcomeMessage.innerText =
        "به سامانه مدیریت وظایف خوش آمدید";

}


// -------------------------------
// آمار داشبورد
// -------------------------------

function updateDashboardStats() {

    const taskRows = document.querySelectorAll(".task-row");

    let totalTasks = taskRows.length;
    let completedTasks = 0;
    let pendingTasks = 0;

    taskRows.forEach(row => {

        const statusElement =
            row.querySelector(".task-status");

        if (!statusElement) {
            return;
        }

        const status =
            statusElement.innerText.trim();

        if (
            status === "تکمیل شده" ||
            status === "تأیید شده"
        ) {

            completedTasks++;

        } else {

            pendingTasks++;

        }

    });

    const totalElement =
        document.getElementById("totalTasks");

    const completedElement =
        document.getElementById("completedTasks");

    const pendingElement =
        document.getElementById("pendingTasks");


    if (totalElement) {
        totalElement.innerText = totalTasks;
    }

    if (completedElement) {
        completedElement.innerText = completedTasks;
    }

    if (pendingElement) {
        pendingElement.innerText = pendingTasks;
    }

}


// اجرای آمار در هنگام باز شدن صفحه
updateDashboardStats();


// -------------------------------
// جلوگیری از ارسال فرم با Enter
// در فیلدهای غیرضروری
// -------------------------------

document.querySelectorAll("input").forEach(input => {

    input.addEventListener("keydown", function (event) {

        if (
            event.key === "Enter" &&
            this.type !== "submit"
        ) {

            event.preventDefault();

        }

    });

});


// -------------------------------
// پیام موفقیت عمومی
// -------------------------------

function showSuccessMessage(message) {

    alert(message);

}


// -------------------------------
// پیام خطای عمومی
// -------------------------------

function showErrorMessage(message) {

    alert(message);

}


// -------------------------------
// آماده شدن سامانه
// -------------------------------

document.addEventListener("DOMContentLoaded", function () {

    console.log(
        "سامانه مدیریت وظایف با موفقیت بارگذاری شد."
    );

});
