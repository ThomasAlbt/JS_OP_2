const api = "http://localhost:5678/api/";

const portfolio = document.getElementById("portfolio");
const login = document.getElementById("password");

const fetchApi = async (url, endpoint) => {
    try {
        const response = await fetch(url + endpoint);

        if (!response.ok) {
            throw new Error(`Response status: ${response.status} / Endpoint = ${endpoint}`);
        }

        const results = await response.json();
        return(results)
    } catch (error) {
        console.error(error.message);
    }
}

const displayProjects = (projectList) => {
    const gallery = portfolio.getElementsByClassName("gallery")[0];
    const template = document.getElementById("project-template");

    projectList.forEach(element => {
        const figure = template.content.firstElementChild.cloneNode(true);
        const image = figure.querySelector("img");

        figure.dataset.categoryId = element.categoryId;
        image.src = element.imageUrl;
        image.alt = element.title;
        figure.querySelector("figcaption").textContent = element.title;

        gallery.append(figure);
    });
}

const displayCategories = (categoriesList) => {
    const filters = portfolio.querySelector(".filters");
    const template = document.getElementById("category-template");

    const showAll = template.content.firstElementChild.cloneNode(true);
    showAll.textContent = "Tous";
    showAll.dataset.categoryId = "0";
    showAll.classList.add("active");
    filters.append(showAll);

    categoriesList.forEach(element => {
        const button = template.content.firstElementChild.cloneNode(true);

        button.textContent = element.name;
        button.dataset.categoryId = element.id;

        filters.append(button);
    });
}

const filterProjects = (categoryId = 0) => {
    const gallery = portfolio.querySelector(".gallery");

    if (categoryId == 0) {
        for (const item of gallery.children) {
            item.classList.remove("hidden");
        }
    } else {
        for (const item of gallery.children) {
            item.dataset.categoryId == categoryId ? item.classList.remove("hidden") : item.classList.add("hidden");
        }
    }
}

const clickListener = () => {
    document.addEventListener("click", (e) => {
        const target = e.target;
        const action = target.dataset.action;

        const modal = document.getElementById("edition-modal");

        switch (action) {
            case "filter":
                filterProjects(target.dataset.categoryId);
                return;
            case "logout":
                lougout();
            case "open-modal":
                modal.showModal();
                return;
            case "close-modal":
                modal.close();
                return;
        }
    });
}

// LOGIN

const inputSubmit = () => {
    document.addEventListener("submit", (e) => {
        e.preventDefault();
        const inputs = formatLoginInput(e.target);
        postLogin(inputs, api);
    })
}

const formatLoginInput = (target) => {
    const form = target.closest("form");
    const formData = new FormData(form);

    const loginInfos = {
        email: formData.get("email"),
        password: formData.get("password")
    };

    if (!loginInfos.email || !loginInfos.password) {
        console.log("No inputs");
        return;
    }

    return(loginInfos);
}

const postLogin = async (loginInputs, api) => {
    try {
        const response = await fetch(api + 'users/login', {
            method: "POST",
            headers: {
                "Content-type": "application/json"
            },
            body: JSON.stringify(loginInputs)
        })

        const result = await response.json();

        if (!response.ok) {
            window.alert("Email or password incorrect.");
            return;
        }

        // using the function isJwt to verify if the token is right, i will make a way to have an endpoint giving you a wrong one
        // it has to be after checking if the response is ok, otherwise faulty login infos will always result in invalid JWT

        if (!isJwt(result.token)) {
            console.error("Invalid JWT");
            return;
        }

        localStorage.setItem("token", result.token);
        localStorage.setItem("userId", result.userId);

        window.location.replace("./index.html");
    } catch (error) {
        console.error("Login error: " + error)
    }
}

const isJwt = (token) => {
    // token is always a string
    if (typeof token !== "string") {
        return false;
    }

    // token is always in 3 parts seprated by a dot, so spliting it should revealed a 3 length array
    const parts = token.split(".");

    if (parts.length !== 3) {
        return false;
    }

    // Apparently there is a way to verify it by decoding it with base64, nee to do more research on how and how can i implemente it

    return true;
};

// LOGOUT

const displayLogin = () => {
    const logout = document.getElementById("logout");
    const login = document.getElementById("login");

    if (localStorage.getItem("token")) {
        logout.classList.remove("hidden");
        login.classList.add("hidden");
    } else {
        login.classList.remove("hidden");
        logout.classList.add("hidden");
    }
}

const lougout = () => {
    localStorage.clear("userId");
    localStorage.clear("token");

    window.location.replace("./index.html");
}

// EDITION

const displayEdition = () => {
    const banner = document.getElementById("banner");
    const open = document.getElementById("show-modal");

    const filtercontainer = document.getElementsByClassName("filters")[0];

    if (localStorage.getItem("token")) {
        banner.classList.remove("hidden");
        open.classList.remove("hidden");
        filtercontainer.classList.add("hidden");
    }
}

const listProjectModal = (projectList) => {
    const template = document.getElementById("delete-project-template");
    const list = document.getElementById("delete-project-list");

    projectList.forEach(element => {
        const form = template.content.firstElementChild.cloneNode(true);
        const image = form.querySelector("img");

        form.dataset.id = element.id;
        image.src = element.imageUrl;
        image.alt = element.title;

        list.append(form);
    });
}

const main = async () => {
    if (portfolio) {
        const projectList = await fetchApi(api, "works");
        const categoriesList = await fetchApi(api, "categories");

        displayProjects(projectList);
        displayCategories(categoriesList);

        displayLogin();
        displayEdition();

        listProjectModal(projectList);
    } else {
        inputSubmit();
    }

    clickListener();
}

main();