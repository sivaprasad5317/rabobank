"use strict";


function unbubble() {

    function unbubbleAB(ab) {
        let ninaContentDiv = ab.querySelector(":scope > div > div");
        console.log("ninaContentDiv found: " + (!!ninaContentDiv) );
    
        let ul = ninaContentDiv.querySelector(":scope > ul:last-child");
        console.log("ul found: " + (!!ul) );
    
        if(ul) {
            // create 2 new div with classes to apply CSS + bubbles on them:            
            const newContentDiv = document.createElement("div");
            newContentDiv.classList.add("NinaMainContent");
            newContentDiv.style["background-color"] = "green";
            
            const newOptionsDiv = document.createElement("div");
            newOptionsDiv.classList.add("NinaOptions");
            newOptionsDiv.style["background-color"] = "red";

            // move all the content to new divs
            newOptionsDiv.appendChild(ul);
            while (ninaContentDiv.childNodes.length > 0) {
                newContentDiv.appendChild(ninaContentDiv.childNodes[0]);
            }

            // put the new divs in again: 
            ninaContentDiv.appendChild(newContentDiv);
            ninaContentDiv.appendChild(newOptionsDiv);

            // mark agent-bubble
            ab.classList.add("ab-option-full");
        } else {
            ab.classList.add("ab-option-less");
        }
    }

    // find u:
    // let ul = document.querySelector("div.agent-bubble div div ul:last-child:not(:first-child)");
    // unbubbleUl(ul);
    let abNodeList = document.querySelectorAll("div.agent-bubble:not(.ab-option-less):not(.ab-option-full)");
    for (let i = 0; i < abNodeList.length; i++) {
        let ab = abNodeList[i];
        console.log(ab);
        unbubbleAB(ab);
    }

}

