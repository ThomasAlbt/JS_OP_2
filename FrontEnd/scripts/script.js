const api = "http://localhost:5678/api/";

const portfolio = document.getElementById("portfolio");
const login = document.getElementById("password");
let imagePreviewUrl;

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

    projectList.forEach(project => {
        const figure = template.content.firstElementChild.cloneNode(true);
        const image = figure.querySelector("img");

        figure.dataset.id = project.id;
        figure.dataset.categoryId = project.categoryId;
        image.src = project.imageUrl;
        image.alt = project.title;
        figure.querySelector("figcaption").textContent = project.title;

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

    for (const button of portfolio.querySelectorAll(".filter-button")) {
        button.classList.toggle("active", button.dataset.categoryId == categoryId);
    }

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

const clickListener = (categoriesList = []) => {
    document.addEventListener("click", (e) => {
        const target = e.target;
        const modal = document.getElementById("edition-modal");

        if (target === modal) {
            modal.close();
            return;
        }

        const actionTarget = target.closest("[data-action]");
        if (!actionTarget) return;

        const action = actionTarget.dataset.action;

        switch (action) {
            case "filter":
                filterProjects(actionTarget.dataset.categoryId);
                return;
            case "logout":
                lougout();
            case "open-modal":
                renderModalView("gallery");
                modal.showModal();
                listProjectModal();
                return;
            case "show-upload":
                renderModalView("upload", categoriesList);
                uploadCategories(categoriesList);
                return;
            case "show-gallery":
                renderModalView("gallery");
                listProjectModal();
                return;
            case "close-modal":
                modal.close();
                return;
        }
    });
};

// Doing the same as i did for click inputs, since there will be multiple submit in one javascript file

const submitListener = () => {
    document.addEventListener("submit", (e) => {
        e.preventDefault();

        const form = e.target;
        const action = form.getAttribute("action");

        switch (action) {
            case "login":
                handleLogin(form);
                return;
            case "delete-work":
                deleteWork(form);
                return;
            case "upload":
                addWork(form);
                return;
        }
    });
};

// LOGIN

const handleLogin = (form) => {
    const formData = new FormData(form);

    const loginInputs = {
        email: formData.get("email"),
        password: formData.get("password")
    };

    postLogin(loginInputs, api);
};

const postLogin = async (loginInputs, api) => {
    try {
        const response = await fetch(api + 'users/login', {
            method: "POST",
            headers: {
                "Content-type": "application/json"
            },
            body: JSON.stringify(loginInputs)
        });

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

// Login/Logout display in header logic

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

// LOGOUT

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

// simple innerhtml for the modal, not a fan of calling other function inside of it, i will chnage that
const renderModalView = (view) => {
    const modal = document.getElementById("edition-modal");

    if (view === "gallery") {
        modal.innerHTML = `
            <div class="gallery-modal">
                <button type="button" data-action="close-modal"><i class="fa-solid fa-xmark"></i></button>
                <h3>Gallery photos</h3>
                <div id="delete-project-list"></div>

                <template id="delete-project-template">
                    <form action="delete-work" method="post">
                        <button type="submit"><i class="fa-solid fa-trash-can"></i></button>
                        <img>
                    </form>
                </template>

                <button type="button" data-action="show-upload">
                    Ajouter une photo
                </button>
            </div>
        `;
        return;
    }

    if (view === "upload") {
        modal.innerHTML = `
            <div class="upload-modal">
                <button type="button" data-action="show-gallery"><i class="fa-solid fa-arrow-left"></i></button>
                <button type="button" data-action="close-modal"><i class="fa-solid fa-xmark"></i></button>
                <h3>Ajout photo</h3>
                <form action="upload" method="post">
                    <label class="upload-file-label" for="image">Photo</label>
                    <div class="upload-file-wrapper">
                        <i class="fa-regular fa-image" aria-hidden="true"></i>
                        <label for="image">Ajouter une photo</label>
                        <input type="file" name="image" id="image" accept="image/*" required>
                        <p>jpg, png : 4mo max</p>
                        <img id="image-preview" class="hidden" alt="Aperçu de la photo">
                    </div>
                    <label for="title">Titre</label>
                    <input type="text" name="title" id="title" required>
                    <label for="category">Catégorie</label>
                    <select name="category" id="category" required></select>
                    <button type="submit">Valider</button>
                </form>
            </div>
        `;
        return;
    }
};

const listProjectModal = () => {
    const template = document.getElementById("delete-project-template");
    const list = document.getElementById("delete-project-list");
    const figures = portfolio.querySelectorAll(".gallery figure");

    figures.forEach(figure => {
        const form = template.content.firstElementChild.cloneNode(true);
        const image = form.querySelector("img");

        form.dataset.id = figure.dataset.id;
        image.src = figure.querySelector("img").src;
        image.alt = figure.querySelector("figcaption").textContent;

        list.append(form);
    });
};

// DELETE/UPLOAD WORK

const deleteWork = async (form) => {
    const id = form.dataset.id;

    try {
        const response = await fetch(api + `works/${id}`, {
            method: "Delete",
            headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            window.alert("delete failed");
            return;
        }

        // id in queriSelector
        portfolio.querySelectorAll(".gallery figure").forEach(figure => {
            if (figure.dataset.id === id) {
                figure.remove();
            }
        });

        form.remove();
    } catch (error) {
        console.error('Delete failed:', error);
    }

}

// Simple port image to the api, maybe i need to make more check to see if its really an image
const addWork = async (form) => {
    const formData = new FormData(form);

    try {
        const response = await fetch(api + "works", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`
            },
            body: formData
        });

        if (!response.ok) {
            window.alert("Add failed");
            return;
        }

        const project = await response.json();

        //will just fetch the api again for now
        displayProjects([project]);
    } catch (error) {
        console.error("Add failed:", error);
    }
};

// preview the image you upload in a img, when a change occur in the document, I check if the id of the input is an image and if it is create a temporary url to put in the src
const setupImagePreview = () => {
    document.addEventListener("change", (e) => {
        const input = e.target;

        if (input.id !== "image") return;

        const preview = document.getElementById("image-preview");
        const file = input.files[0];

        if (!file) {
            preview.classList.add("hidden");
            return;
        }

        preview.src = URL.createObjectURL(file);
        preview.classList.remove("hidden");
    });
};

const uploadCategories = (categoriesList) => {
    const selectCategories = document.getElementById("category");

    // Option(text, value = empty because its a placeholder, defaultSelected, selected = selected now)
    const placeholder = new Option("", "", true, true);
    placeholder.disabled = true;
    selectCategories.replaceChildren(placeholder);

    categoriesList.forEach(category => {
        const option = new Option(category.name, category.id);
        selectCategories.append(option);
    });
};


const main = async () => {
    let categoriesList = [];

    if (portfolio) {
        const projectList = await fetchApi(api, "works");
        categoriesList = await fetchApi(api, "categories");

        displayProjects(projectList);
        displayCategories(categoriesList);

        displayLogin();
        displayEdition();
    }

    submitListener();
    setupImagePreview();
    clickListener(categoriesList);
};

// add onload event
window.addEventListener("load", () => {
    main();
});