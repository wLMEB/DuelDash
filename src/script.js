import { render as landingRender } from "./landing.js";

let isFirstLoad = true;

function navigate(viewId) { // display the requested view by viewId
  // Hide all views
  document.querySelectorAll(".view").forEach((view) => {
    view.style.display = "none";
  });

  switch (viewId) {
    case "landing":
      landingRender();
      break;
    case "racer":
      racerRender();
      break;
    // Add more cases for other views if needed
  }

  // Show the requested view
  
  console.log("in navigate");
}

document.addEventListener("DOMContentLoaded", () => {
  // Check if this is the first time the DOM has loaded
  if (isFirstLoad) {
    console.log("DOM loaded for the first time");
    navigate("landing");
    isFirstLoad = false; // Set the flag to false after the first load
  }

  // Add event listeners to dynamically created buttons
  document.querySelectorAll('.nav-link, .navbar-brand').forEach(link => {
    link.addEventListener('click', function(event) {
      // Get viewId from href and call navigate with it
      const viewId = this.getAttribute('href').substring(1);
      navigate(viewId);
    });
  });
});

export { navigate };