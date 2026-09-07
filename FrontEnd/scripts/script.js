const api = "http://localhost:5678/api/"

const fetchApi = async (url, endpoint) => {
    try {
        const response = await fetch(url + endpoint)

        if (!response.ok) {
            throw new Error(`Response status: ${response.status} / Endpoint = ${endpoint}`);
        }

        const results = await response.json()
        return(results)
    } catch (error) {
        console.error(error.message)
    }
}

const portfolio = document.getElementById("portfolio");

const displayProject = (projectList) => {
    const gallery = portfolio.getElementsByClassName("gallery")[0];

    gallery.replaceChildren()

    projectList.forEach(element => {
        gallery.innerHTML += 
        `
            <figure data-category-id=${element.categoryId}>
                <img src=${element.imageUrl} alt=${element.title}>
                <figcaption>${element.title}<figcatpion/>
            <figure/>
        `
    });
}

const displayCategories = (categoriesList, projectList) => {
    const filters = portfolio.querySelector(".filters");
    const template = document.getElementById("category-template");

    filters.replaceChildren();

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
            item.style.display = 'block'
        }
    } else {
        for (const item of gallery.children) {
            item.dataset.categoryId == categoryId ? item.style.display = 'block' : item.style.display = 'none';
        }
    }
}

const clickListener = () => {
    document.addEventListener("click", (e) => {
        filterProjects(e.target.dataset.categoryId)
    })
}

const main = async () => {
    const projectList = await fetchApi(api, "works");
    const categoriesList = await fetchApi(api, "categories");

    displayProject(projectList);
    displayCategories(categoriesList, projectList);
    clickListener();
}

main()