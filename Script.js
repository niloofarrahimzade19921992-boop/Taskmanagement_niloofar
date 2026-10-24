// ======================================================
// سامانه مدیریت وظایف سازمانی
// JavaScript - نسخه هماهنگ با HTML جدید
// ======================================================

document.addEventListener("DOMContentLoaded", function () {

    // ==================================================
    // داده‌های اولیه فرضی
    // ==================================================

    const defaultProjects = [
        {
            id: 1,
            name: "بهبود فرآیندهای سامانه بانکی",
            manager: "سارا احمدی",
            startDate: "۱۴۰۵/۰۷/۰۱",
            endDate: "۱۴۰۵/۱۰/۳۰",
            description: "بهبود و استانداردسازی فرآیندهای عملیاتی سامانه"
        },
        {
            id: 2,
            name: "توسعه داشبورد مدیریتی",
            manager: "علی رضایی",
            startDate: "۱۴۰۵/۰۸/۰۱",
            endDate: "۱۴۰۵/۱۱/۱۵",
            description: "طراحی داشبورد مدیریتی و گزارش‌های تجمیعی"
        },
        {
            id: 3,
            name: "ارتقای سیستم مدیریت وظایف",
            manager: "مریم کریمی",
            startDate: "۱۴۰۵/۰۶/۱۵",
            endDate: "۱۴۰۵/۰۹/۳۰",
            description: "بهبود امکانات مدیریت وظایف و فرآیند تأییدات"
        }
    ];

    const defaultTasks = [
        {
            id: 1,
            projectId: 1,
            title: "بررسی فرآیند ثبت درخواست",
            status: "done",
            responsible: "محمد رضایی",
            owner: "مدیر واحد عملیات",
            supervisor: "سارا احمدی",
            approver: "مریم کریمی",
            startDate: "۱۴۰۵/۰۷/۰۵",
            endDate: "۱۴۰۵/۰۷/۱۵",
            description: "بررسی وضعیت فعلی فرآیند ثبت درخواست",
            latestStatus: "بررسی با موفقیت انجام شد",
            documentName: "گزارش-بررسی.pdf"
        },
        {
            id: 2,
            projectId: 1,
            title: "طراحی فرآیند جدید",
            status: "progress",
            responsible: "علی محمدی",
            owner: "مدیر پروژه",
            supervisor: "سارا احمدی",
            approver: "مریم کریمی",
            startDate: "۱۴۰۵/۰۷/۱۸",
            endDate: "۱۴۰۵/۰۸/۲۰",
            description: "طراحی فرآیند جدید بر اساس نتایج بررسی",
            latestStatus: "نسخه اولیه فرآیند آماده شده است",
            documentName: "فرآیند-جدید.docx"
        },
        {
            id: 3,
            projectId: 2,
            title: "طراحی صفحه گزارشات",
            status: "progress",
            responsible: "نگار حسینی",
            owner: "مدیر فناوری",
            supervisor: "علی رضایی",
            approver: "مریم کریمی",
            startDate: "۱۴۰۵/۰۸/۰۲",
            endDate: "۱۴۰۵/۰۹/۰۵",
            description: "طراحی رابط کاربری گزارشات مدیریتی",
            latestStatus: "طراحی ۷۰ درصد پیشرفت داشته است",
            documentName: "UI-Report.fig"
        },
        {
            id: 4,
            projectId: 2,
            title: "تهیه گزارش عملکرد ماهانه",
            status: "pending",
            responsible: "رضا کریمی",
            owner: "مدیر واحد",
            supervisor: "علی رضایی",
            approver: "مریم کریمی",
            startDate: "۱۴۰۵/۰۸/۱۰",
            endDate: "۱۴۰۵/۰۸/۳۰",
            description: "تهیه گزارش عملکرد ماهانه",
            latestStatus: "در انتظار شروع",
            documentName: "گزارش-ماهانه.xlsx"
        },
        {
            id: 5,
            projectId: 3,
            title: "بررسی کاربران سامانه",
            status: "done",
            responsible: "سارا محمدی",
            owner: "مدیر سامانه",
            supervisor: "مریم کریمی",
            approver: "علی رضایی",
            startDate: "۱۴۰۵/۰۶/۲۰",
            endDate: "۱۴۰۵/۰۷/۱۰",
            description: "بررسی کاربران و سطح دسترسی آنها",
            latestStatus: "تأیید نهایی دریافت شد",
            documentName: "users-report.xlsx"
        },
        {
            id: 6,
            projectId: 3,
            title: "تعریف سطح دسترسی",
            status: "pending",
            responsible: "امیر حسینی",
            owner: "مدیر فناوری",
            supervisor: "مریم کریمی",
            approver: "",
            startDate: "۱۴۰۵/۰۸/۰۵",
            endDate: "۱۴۰۵/۰۸/۲۵",
            description: "تعریف سطح دسترسی کاربران سامانه",
            latestStatus: "تأییدکننده تعیین نشده است",
            documentName: ""
        }
    ];


    // ==================================================
    // دریافت اطلاعات از LocalStorage
    // ==================================================

    let projects = JSON.parse(
        localStorage.getItem("taskSystemProjects")
    );

    let tasks = JSON.parse(
        localStorage.getItem("taskSystemTasks")
    );

    if (!projects || projects.length === 0) {
        projects = defaultProjects;
        saveProjects();
    }

    if (!tasks || tasks.length === 0) {
        tasks = defaultTasks;
        saveTasks();
    }


    function saveProjects() {
        localStorage.setItem(
            "taskSystemProjects",
            JSON.stringify(projects)
        );
    }

    function saveTasks() {
        localStorage.setItem(
            "taskSystemTasks",
            JSON.stringify(tasks)
        );
    }


    // ==================================================
    // عناصر صفحه
    // ==================================================

    const navItems = document.querySelectorAll(".menu-item[data-section]");
    const pages = document.querySelectorAll(".page-section");
    const sidebar = document.querySelector(".sidebar");
    const menuButton = document.querySelector(".menu-button");


    // ==================================================
    // جابه‌جایی بین صفحات
    // ==================================================

    function showPage(pageId) {

        pages.forEach(page => {
            page.classList.remove("active");
        });

        navItems.forEach(item => {
            item.classList.remove("active");
        });

        const targetPage = document.getElementById(pageId);

        if (targetPage) {
            targetPage.classList.add("active");
        }

        const activeButton = document.querySelector(
            `.menu-item[data-section="${pageId}"]`
        );

        if (activeButton) {
            activeButton.classList.add("active");
        }

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    }


    navItems.forEach(item => {

        item.addEventListener("click", function () {

            const pageId = this.getAttribute("data-section");

            if (pageId) {
                showPage(pageId);
            }

            if (
                window.innerWidth <= 768 &&
                sidebar
            ) {
                sidebar.classList.remove("open");
            }

        });

    });


    // ==================================================
    // دکمه‌هایی که data-go دارند
    // ==================================================

    document.querySelectorAll("[data-go]").forEach(button => {

        button.addEventListener("click", function () {

            const target = this.getAttribute("data-go");

            if (target) {
                showPage(target);
            }

        });

    });


    // ==================================================
    // منوی موبایل
    // ==================================================

    if (menuButton && sidebar) {

        menuButton.addEventListener("click", function () {
            sidebar.classList.toggle("open");
        });

    }


    // ==================================================
    // توابع کمکی
    // ==================================================

    function getProjectName(projectId) {

        const project = projects.find(
            item => Number(item.id) === Number(projectId)
        );

        return project
            ? project.name
            : "بدون پروژه";
    }


    function getStatusText(status) {

        const statuses = {
            pending: "در انتظار انجام",
            progress: "در حال انجام",
            done: "تکمیل‌شده",
            rejected: "رد شده"
        };

        return statuses[status] || status;
    }


    function getStatusClass(status) {

        const classes = {
            pending: "status-pending",
            progress: "status-progress",
            done: "status-done",
            rejected: "status-rejected"
        };

        return classes[status] || "";
    }


    // ==================================================
    // نمایش پروژه‌ها در فرم وظیفه
    // ==================================================

    function renderProjectOptions() {

        const taskProject = document.getElementById("taskProject");

        if (!taskProject) {
            return;
        }

        taskProject.innerHTML =
            `<option value="">انتخاب پروژه</option>`;

        projects.forEach(project => {

            const option = document.createElement("option");

            option.value = project.id;
            option.textContent = project.name;

            taskProject.appendChild(option);

        });
    }


    // ==================================================
    // نمایش لیست پروژه‌ها
    // ==================================================

    function renderProjects() {

        const body = document.getElementById(
            "projectTableBody"
        );

        const message = document.getElementById(
            "projectListMessage"
        );

        if (!body) {
            return;
        }

        body.innerHTML = "";

        if (projects.length === 0) {

            if (message) {
                message.textContent =
                    "هنوز پروژه‌ای ثبت نشده است.";
            }

            return;
        }

        if (message) {
            message.textContent = "";
        }

        projects.forEach(project => {

            const taskCount = tasks.filter(
                task =>
                    Number(task.projectId) ===
                    Number(project.id)
            ).length;

            const row = document.createElement("tr");

            row.innerHTML = `
                <td>${project.name}</td>
                <td>${project.manager || "—"}</td>
                <td>${project.startDate || "—"}</td>
                <td>${project.endDate || "—"}</td>
                <td>${toPersianNumber(taskCount)}</td>

                <td>
                    <button
                        class="table-btn edit-project"
                        data-id="${project.id}"
                    >
                        ویرایش
                    </button>

                    <button
                        class="table-btn danger delete-project"
                        data-id="${project.id}"
                    >
                        حذف
                    </button>
                </td>
            `;

            body.appendChild(row);

        });


        document
            .querySelectorAll(".edit-project")
            .forEach(button => {

                button.addEventListener(
                    "click",
                    function () {

                        editProject(
                            Number(this.dataset.id)
                        );

                    }
                );

            });


        document
            .querySelectorAll(".delete-project")
            .forEach(button => {

                button.addEventListener(
                    "click",
                    function () {

                        deleteProject(
                            Number(this.dataset.id)
                        );

                    }
                );

            });

    }


    // ==================================================
    // ایجاد پروژه
    // ==================================================

    const projectForm =
        document.getElementById("projectForm");

    if (projectForm) {

        projectForm.addEventListener(
            "submit",
            function (event) {

                event.preventDefault();

                const name =
                    document.getElementById(
                        "projectName"
                    ).value.trim();

                if (!name) {

                    alert(
                        "لطفاً نام پروژه را وارد کنید."
                    );

                    return;
                }

                const projectId =
                    document.getElementById(
                        "projectId"
                    ).value;

                const projectData = {

                    id: projectId
                        ? Number(projectId)
                        : Date.now(),

                    name: name,

                    manager:
                        document.getElementById(
                            "projectManager"
                        ).value.trim(),

                    startDate:
                        document.getElementById(
                            "projectStartDate"
                        ).value.trim(),

                    endDate:
                        document.getElementById(
                            "projectEndDate"
                        ).value.trim(),

                    description:
                        document.getElementById(
                            "projectDescription"
                        ).value.trim()
                };


                if (projectId) {

                    const index =
                        projects.findIndex(
                            p =>
                                Number(p.id) ===
                                Number(projectId)
                        );

                    if (index !== -1) {
                        projects[index] =
                            projectData;
                    }

                    showMessage(
                        "projectMessage",
                        "پروژه با موفقیت ویرایش شد."
                    );

                } else {

                    projects.push(projectData);

                    showMessage(
                        "projectMessage",
                        "پروژه با موفقیت ایجاد شد."
                    );
                }


                saveProjects();

                renderProjects();
                renderProjectOptions();
                updateDashboard();

                projectForm.reset();

                document.getElementById(
                    "projectId"
                ).value = "";

            }
        );

    }


    // ==================================================
    // پاک کردن فرم پروژه
    // ==================================================

    const cancelProjectEdit =
        document.getElementById(
            "cancelProjectEdit"
        );

    if (cancelProjectEdit) {

        cancelProjectEdit.addEventListener(
            "click",
            function () {

                projectForm.reset();

                const id =
                    document.getElementById(
                        "projectId"
                    );

                if (id) {
                    id.value = "";
                }

                showMessage(
                    "projectMessage",
                    "فرم پروژه پاک شد."
                );

            }
        );

    }


    // ==================================================
    // ویرایش پروژه
    // ==================================================

    function editProject(id) {

        const project =
            projects.find(
                p => Number(p.id) === Number(id)
            );

        if (!project) {
            return;
        }

        showPage("projects");

        document.getElementById(
            "projectId"
        ).value = project.id;

        document.getElementById(
            "projectName"
        ).value = project.name || "";

        document.getElementById(
            "projectManager"
        ).value = project.manager || "";

        document.getElementById(
            "projectStartDate"
        ).value = project.startDate || "";

        document.getElementById(
            "projectEndDate"
        ).value = project.endDate || "";

        document.getElementById(
            "projectDescription"
        ).value = project.description || "";

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

    }


    // ==================================================
    // حذف پروژه
    // ==================================================

    function deleteProject(id) {

        const hasTasks =
            tasks.some(
                task =>
                    Number(task.projectId) ===
                    Number(id)
            );

        if (hasTasks) {

            alert(
                "این پروژه دارای وظیفه است و تا زمانی که وظایف آن حذف یا منتقل نشوند قابل حذف نیست."
            );

            return;
        }

        const confirmed =
            confirm(
                "آیا از حذف این پروژه مطمئن هستید؟"
            );

        if (!confirmed) {
            return;
        }

        projects =
            projects.filter(
                p =>
                    Number(p.id) !== Number(id)
            );

        saveProjects();

        renderProjects();
        renderProjectOptions();
        updateDashboard();

    }


    // ==================================================
    // ایجاد وظیفه
    // ==================================================

    const taskForm =
        document.getElementById("taskForm");

    if (taskForm) {

        taskForm.addEventListener(
            "submit",
            function (event) {

                event.preventDefault();

                const title =
                    document.getElementById(
                        "title"
                    ).value.trim();

                const projectId =
                    document.getElementById(
                        "taskProject"
                    ).value;

                if (!projectId) {

                    alert(
                        "لطفاً پروژه را انتخاب کنید."
                    );

                    return;
                }

                if (!title) {

                    alert(
                        "لطفاً عنوان وظیفه را وارد کنید."
                    );

                    return;
                }


                const taskId =
                    document.getElementById(
                        "taskId"
                    ).value;


                const taskData = {

                    id: taskId
                        ? Number(taskId)
                        : Date.now(),

                    projectId:
                        Number(projectId),

                    title: title,

                    status:
                        document.getElementById(
                            "status"
                        ).value,

                    responsible:
                        document.getElementById(
                            "responsible"
                        ).value.trim(),

                    owner:
                        document.getElementById(
                            "owner"
                        ).value.trim(),

                    supervisor:
                        document.getElementById(
                            "supervisor"
                        ).value.trim(),

                    approver:
                        document.getElementById(
                            "approver"
                        ).value.trim(),

                    startDate:
                        document.getElementById(
                            "startDate"
                        ).value.trim(),

                    endDate:
                        document.getElementById(
                            "endDate"
                        ).value.trim(),

                    description:
                        document.getElementById(
                            "description"
                        ).value.trim(),

                    latestStatus:
                        document.getElementById(
                            "latestStatus"
                        ).value.trim(),

                    documentName:
                        document.getElementById(
                            "documentName"
                        ).value.trim()

                };


                if (taskId) {

                    const index =
                        tasks.findIndex(
                            task =>
                                Number(task.id) ===
                                Number(taskId)
                        );

                    if (index !== -1) {
                        tasks[index] = taskData;
                    }

                    showMessage(
                        "formMessage",
                        "وظیفه با موفقیت ویرایش شد."
                    );

                } else {

                    tasks.push(taskData);

                    showMessage(
                        "formMessage",
                        "وظیفه با موفقیت ثبت شد."
                    );

                }


                saveTasks();

                renderTasks();
                renderApprovals();
                renderSchedule();
                updateDashboard();

                taskForm.reset();

                document.getElementById(
                    "taskId"
                ).value = "";

            }
        );

    }


    // ==================================================
    // نمایش وظایف
    // ==================================================

    function renderTasks(filterText = "") {

        const body =
            document.getElementById(
                "taskTableBody"
            );

        const message =
            document.getElementById(
                "taskListMessage"
            );

        if (!body) {
            return;
        }

        body.innerHTML = "";

        const search =
            filterText.toLowerCase().trim();


        const filtered =
            tasks.filter(task => {

                const text = (
                    task.title +
                    " " +
                    getProjectName(task.projectId) +
                    " " +
                    (task.responsible || "") +
                    " " +
                    getStatusText(task.status)
                ).toLowerCase();

                return text.includes(search);

            });


        if (filtered.length === 0) {

            if (message) {
                message.textContent =
                    "وظیفه‌ای برای نمایش وجود ندارد.";
            }

            return;
        }

        if (message) {
            message.textContent = "";
        }


        filtered.forEach(task => {

            const row =
                document.createElement("tr");

            row.className = "task-row";

            row.innerHTML = `

                <td>
                    <strong>${task.title}</strong>
                </td>

                <td>
                    ${getProjectName(task.projectId)}
                </td>

                <td>
                    ${task.responsible || "—"}
                </td>

                <td>
                    ${task.endDate || "—"}
                </td>

                <td>
                    <span class="task-status ${getStatusClass(task.status)}">
                        ${getStatusText(task.status)}
                    </span>
                </td>

                <td>

                    <button
                        class="table-btn edit-task"
                        data-id="${task.id}"
                    >
                        ویرایش
                    </button>

                    <button
                        class="table-btn danger delete-task"
                        data-id="${task.id}"
                    >
                        حذف
                    </button>

                </td>
            `;

            body.appendChild(row);

        });


        document
            .querySelectorAll(".edit-task")
            .forEach(button => {

                button.addEventListener(
                    "click",
                    function () {

                        editTask(
                            Number(this.dataset.id)
                        );

                    }
                );

            });


        document
            .querySelectorAll(".delete-task")
            .forEach(button => {

                button.addEventListener(
                    "click",
                    function () {

                        deleteTask(
                            Number(this.dataset.id)
                        );

                    }
                );

            });

    }


    // ==================================================
    // ویرایش وظیفه
    // ==================================================

    function editTask(id) {

        const task =
            tasks.find(
                t => Number(t.id) === Number(id)
            );

        if (!task) {
            return;
        }

        showPage("tasks");

        document.getElementById(
            "taskId"
        ).value = task.id;

        document.getElementById(
            "taskProject"
        ).value = task.projectId;

        document.getElementById(
            "title"
        ).value = task.title || "";

        document.getElementById(
            "status"
        ).value = task.status || "pending";

        document.getElementById(
            "responsible"
        ).value = task.responsible || "";

        document.getElementById(
            "owner"
        ).value = task.owner || "";

        document.getElementById(
            "supervisor"
        ).value = task.supervisor || "";

        document.getElementById(
            "approver"
        ).value = task.approver || "";

        document.getElementById(
            "startDate"
        ).value = task.startDate || "";

        document.getElementById(
            "endDate"
        ).value = task.endDate || "";

        document.getElementById(
            "description"
        ).value = task.description || "";

        document.getElementById(
            "latestStatus"
        ).value = task.latestStatus || "";

        document.getElementById(
            "documentName"
        ).value = task.documentName || "";

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

    }


    // ==================================================
    // حذف وظیفه
    // ==================================================

    function deleteTask(id) {

        const confirmed =
            confirm(
                "آیا از حذف این وظیفه مطمئن هستید؟"
            );

        if (!confirmed) {
            return;
        }

        tasks =
            tasks.filter(
                task =>
                    Number(task.id) !== Number(id)
            );

        saveTasks();

        renderTasks();
        renderApprovals();
        renderSchedule();
        updateDashboard();

    }


    // ==================================================
    // جستجوی وظایف
    // ==================================================

    const searchTasks =
        document.getElementById(
            "searchTasks"
        );

    if (searchTasks) {

        searchTasks.addEventListener(
            "input",
            function () {

                renderTasks(this.value);

            }
        );

    }


    // ==================================================
    // انصراف از ویرایش وظیفه
    // ==================================================

    const cancelEdit =
        document.getElementById(
            "cancelEdit"
        );

    if (cancelEdit) {

        cancelEdit.addEventListener(
            "click",
            function () {

                taskForm.reset();

                document.getElementById(
                    "taskId"
                ).value = "";

                showMessage(
                    "formMessage",
                    "فرم پاک شد."
                );

            }
        );

    }


    // ==================================================
    // مرکز تأییدات
    // ==================================================

    function renderApprovals() {

        const body =
            document.getElementById(
                "approvalTableBody"
            );

        const message =
            document.getElementById(
                "approvalMessage"
            );

        if (!body) {
            return;
        }

        body.innerHTML = "";


        const filter =
            document.getElementById(
                "approvalFilter"
            );

        const selectedFilter =
            filter
                ? filter.value
                : "all";


        let approvalTasks =
            tasks.filter(
                task =>
                    task.approver &&
                    task.approver.trim() !== ""
            );


        if (selectedFilter !== "all") {

            approvalTasks =
                approvalTasks.filter(
                    task => {

                        if (
                            selectedFilter ===
                            "pending"
                        ) {
                            return (
                                task.status ===
                                "progress"
                            );
                        }

                        if (
                            selectedFilter ===
                            "approved"
                        ) {
                            return (
                                task.status ===
                                "done"
                            );
                        }

                        if (
                            selectedFilter ===
                            "rejected"
                        ) {
                            return (
                                task.status ===
                                "rejected"
                            );
                        }

                        return true;

                    }
                );

        }


        if (approvalTasks.length === 0) {

            if (message) {
                message.textContent =
                    "موردی برای تأیید وجود ندارد.";
            }

            return;
        }

        if (message) {
            message.textContent = "";
        }


        approvalTasks.forEach(task => {

            const row =
                document.createElement("tr");

            let operation = "";


            if (task.status === "progress") {

                operation = `

                    <button
                        class="table-btn approve-btn"
                        data-id="${task.id}"
                    >
                        تأیید
                    </button>

                    <button
                        class="table-btn danger reject-btn"
                        data-id="${task.id}"
                    >
                        رد
                    </button>

                `;

            } else {

                operation = "—";

            }


            row.innerHTML = `

                <td>${task.title}</td>

                <td>
                    ${getProjectName(task.projectId)}
                </td>

                <td>
                    ${task.approver}
                </td>

                <td>
                    <span class="task-status ${getStatusClass(task.status)}">
                        ${
                            task.status === "progress"
                                ? "در انتظار بررسی"
                                : getStatusText(task.status)
                        }
                    </span>
                </td>

                <td>${operation}</td>

            `;

            body.appendChild(row);

        });


        document
            .querySelectorAll(".approve-btn")
            .forEach(button => {

                button.addEventListener(
                    "click",
                    function () {

                        const id =
                            Number(
                                this.dataset.id
                            );

                        const task =
                            tasks.find(
                                t =>
                                    Number(t.id) === id
                            );

                        if (!task) {
                            return;
                        }

                        const confirmed =
                            confirm(
                                "آیا از تأیید این وظیفه اطمینان دارید؟"
                            );

                        if (!confirmed) {
                            return;
                        }

                        task.status = "done";

                        saveTasks();

                        renderApprovals();
                        renderTasks();
                        updateDashboard();

                        alert(
                            "وظیفه با موفقیت تأیید شد."
                        );

                    }
                );

            });


        document
            .querySelectorAll(".reject-btn")
            .forEach(button => {

                button.addEventListener(
                    "click",
                    function () {

                        const id =
                            Number(
                                this.dataset.id
                            );

                        const task =
                            tasks.find(
                                t =>
                                    Number(t.id) === id
                            );

                        if (!task) {
                            return;
                        }

                        const confirmed =
                            confirm(
                                "آیا می‌خواهید این وظیفه را رد کنید؟"
                            );

                        if (!confirmed) {
                            return;
                        }

                        task.status = "rejected";

                        saveTasks();

                        renderApprovals();
                        renderTasks();
                        updateDashboard();

                        alert(
                            "وظیفه رد شد."
                        );

                    }
                );

            });

    }


    const approvalFilter =
        document.getElementById(
            "approvalFilter"
        );

    if (approvalFilter) {

        approvalFilter.addEventListener(
            "change",
            renderApprovals
        );

    }


    // ==================================================
    // زمان‌بندی / WBS / Gantt
    // ==================================================

    function renderSchedule() {

        const wbs =
            document.getElementById(
                "wbsList"
            );

        const gantt =
            document.getElementById(
                "ganttList"
            );

        if (!wbs || !gantt) {
            return;
        }


        const projectFilter =
            document.getElementById(
                "scheduleProjectFilter"
            );

        const selectedProject =
            projectFilter
                ? projectFilter.value
                : "all";


        let scheduleTasks = tasks;


        if (
            selectedProject &&
            selectedProject !== "all"
        ) {

            scheduleTasks =
                tasks.filter(
                    task =>
                        String(task.projectId) ===
                        String(selectedProject)
                );

        }


        // WBS

        if (scheduleTasks.length === 0) {

            wbs.innerHTML =
                "فعالیتی برای نمایش وجود ندارد.";

            gantt.innerHTML =
                "فعالیتی برای نمایش وجود ندارد.";

            return;
        }


        wbs.innerHTML = scheduleTasks
            .map((task, index) => {

                return `

                    <div class="wbs-item">

                        <strong>
                            ${toPersianNumber(index + 1)}.
                            ${task.title}
                        </strong>

                        <span>
                            ${getProjectName(task.projectId)}
                        </span>

                        <small>
                            ${task.startDate || "—"}
                            تا
                            ${task.endDate || "—"}
                        </small>

                    </div>

                `;

            })
            .join("");


        // Gantt

        gantt.innerHTML = scheduleTasks
            .map(task => {

                return `

                    <div class="gantt-item">

                        <div class="gantt-info">

                            <strong>
                                ${task.title}
                            </strong>

                            <small>
                                ${task.startDate || "—"}
                                تا
                                ${task.endDate || "—"}
                            </small>

                        </div>

                        <div class="gantt-track">

                            <div
                                class="gantt-bar ${getStatusClass(task.status)}"
                                style="width: ${
                                    task.status === "done"
                                        ? "90%"
                                        : task.status === "progress"
                                            ? "65%"
                                            : "35%"
                                };"
                            ></div>

                        </div>

                    </div>

                `;

            })
            .join("");

    }


    // فهرست پروژه‌های زمان‌بندی

    function renderScheduleProjects() {

        const select =
            document.getElementById(
                "scheduleProjectFilter"
            );

        if (!select) {
            return;
        }

        select.innerHTML =
            `<option value="all">همه پروژه‌ها</option>`;

        projects.forEach(project => {

            const option =
                document.createElement("option");

            option.value = project.id;
            option.textContent = project.name;

            select.appendChild(option);

        });

    }


    const scheduleProjectFilter =
        document.getElementById(
            "scheduleProjectFilter"
        );

    if (scheduleProjectFilter) {

        scheduleProjectFilter.addEventListener(
            "change",
            renderSchedule
        );

    }


    // ==================================================
    // داشبورد
    // ==================================================

    function updateDashboard() {

        const total =
            tasks.length;

        const progress =
            tasks.filter(
                task =>
                    task.status === "progress"
            ).length;

        const done =
            tasks.filter(
                task =>
                    task.status === "done"
            ).length;

        const pending =
            tasks.filter(
                task =>
                    task.status === "pending"
            ).length;

        const approvals =
            tasks.filter(
                task =>
                    task.approver &&
                    task.approver.trim() !== "" &&
                    task.status === "progress"
            ).length;


        setText(
            "projectCount",
            toPersianNumber(projects.length)
        );

        setText(
            "totalCount",
            toPersianNumber(total)
        );

        setText(
            "progressCount",
            toPersianNumber(progress)
        );

        setText(
            "approvalCount",
            toPersianNumber(approvals)
        );


        setText(
            "pendingCount",
            toPersianNumber(pending)
        );

        setText(
            "progressReportCount",
            toPersianNumber(progress)
        );

        setText(
            "doneCount",
            toPersianNumber(done)
        );


        const totalForPercent =
            total || 1;


        setWidth(
            "pendingBar",
            (pending / totalForPercent) * 100
        );

        setWidth(
            "progressBar",
            (progress / totalForPercent) * 100
        );

        setWidth(
            "doneBar",
            (done / totalForPercent) * 100
        );


        setText(
            "waitingApprovalCount",
            toPersianNumber(approvals)
        );

        setText(
            "approvedCount",
            toPersianNumber(
                tasks.filter(
                    task =>
                        task.status === "done" &&
                        task.approver
                ).length
            )
        );

        setText(
            "rejectedCount",
            toPersianNumber(
                tasks.filter(
                    task =>
                        task.status === "rejected"
                ).length
            )
        );


        renderRecentTasks();
        renderProjectReport();

    }


    // ==================================================
    // آخرین وظایف
    // ==================================================

    function renderRecentTasks() {

        const container =
            document.getElementById(
                "recentTasks"
            );

        if (!container) {
            return;
        }

        const recent =
            [...tasks]
                .reverse()
                .slice(0, 5);


        if (recent.length === 0) {

            container.innerHTML =
                "هنوز وظیفه‌ای ثبت نشده است.";

            return;
        }


        container.innerHTML =
            recent.map(task => {

                return `

                    <div class="recent-item">

                        <div>

                            <strong>
                                ${task.title}
                            </strong>

                            <small>
                                ${getProjectName(task.projectId)}
                            </small>

                        </div>

                        <span class="task-status ${getStatusClass(task.status)}">
                            ${getStatusText(task.status)}
                        </span>

                    </div>

                `;

            }).join("");

    }


    // ==================================================
    // گزارش پروژه‌ها
    // ==================================================

    function renderProjectReport() {

        const body =
            document.getElementById(
                "projectReportBody"
            );

        if (!body) {
            return;
        }

        body.innerHTML = "";


        projects.forEach(project => {

            const projectTasks =
                tasks.filter(
                    task =>
                        Number(task.projectId) ===
                        Number(project.id)
                );


            const done =
                projectTasks.filter(
                    task =>
                        task.status === "done"
                ).length;


            const progress =
                projectTasks.filter(
                    task =>
                        task.status === "progress"
                ).length;


            const pending =
                projectTasks.filter(
                    task =>
                        task.status === "pending"
                ).length;


            const row =
                document.createElement("tr");


            row.innerHTML = `

                <td>
                    <strong>
                        ${project.name}
                    </strong>
                </td>

                <td>
                    ${toPersianNumber(projectTasks.length)}
                </td>

                <td>
                    ${toPersianNumber(done)}
                </td>

                <td>
                    ${toPersianNumber(progress)}
                </td>

                <td>
                    ${toPersianNumber(pending)}
                </td>

            `;

            body.appendChild(row);

        });

    }


    // ==================================================
    // جستجوی پروژه‌ها
    // ==================================================

    const searchProjects =
        document.getElementById(
            "searchProjects"
        );

    if (searchProjects) {

        searchProjects.addEventListener(
            "input",
            function () {

                const value =
                    this.value
                        .toLowerCase()
                        .trim();

                document
                    .querySelectorAll(
                        "#projectTableBody tr"
                    )
                    .forEach(row => {

                        row.style.display =
                            row.innerText
                                .toLowerCase()
                                .includes(value)
                                ? ""
                                : "none";

                    });

            }
        );

    }


    // ==================================================
    // تاریخ شمسی
    // ==================================================

    function getPersianDate() {

        return new Intl.DateTimeFormat(
            "fa-IR-u-ca-persian",
            {
                year: "numeric",
                month: "2-digit",
                day: "2-digit"
            }
        ).format(new Date());

    }


    const currentDate =
        document.getElementById(
            "currentDate"
        );

    if (currentDate) {
        currentDate.innerText =
            getPersianDate();
    }


    document
        .querySelectorAll(".jalali-input")
        .forEach(input => {

            input.addEventListener(
                "input",
                function () {

                    this.value =
                        this.value
                            .replace(/[^\d۰-۹/]/g, "");

                }
            );

        });


    // ==================================================
    // توابع عمومی
    // ==================================================

    function setText(id, value) {

        const element =
            document.getElementById(id);

        if (element) {
            element.innerText = value;
        }

    }


    function setWidth(id, percent) {

        const element =
            document.getElementById(id);

        if (element) {

            element.style.width =
                `${Math.max(
                    0,
                    Math.min(100, percent)
                )}%`;

        }

    }


    function showMessage(id, message) {

        const element =
            document.getElementById(id);

        if (!element) {
            return;
        }

        element.innerText = message;

        setTimeout(() => {

            element.innerText = "";

        }, 3000);

    }


    function toPersianNumber(number) {

        return String(number)
            .replace(/\d/g, digit =>
                "۰۱۲۳۴۵۶۷۸۹"[digit]
            );

    }


    // ==================================================
    // جلوگیری از ارسال Enter در فیلدها
    // ==================================================

    document
        .querySelectorAll("input")
        .forEach(input => {

            input.addEventListener(
                "keydown",
                function (event) {

                    if (
                        event.key === "Enter" &&
                        this.type !== "submit"
                    ) {
                        event.preventDefault();
                    }

                }
            );

        });


    // ==================================================
    // اجرای اولیه سامانه
    // ==================================================

    renderProjectOptions();
    renderProjects();
    renderTasks();
    renderApprovals();
    renderScheduleProjects();
    renderSchedule();
    updateDashboard();


    console.log(
        "سامانه مدیریت وظایف با موفقیت بارگذاری شد."
    );

});
