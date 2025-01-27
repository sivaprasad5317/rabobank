/************************** Custom Bootstrap C2C rendering logic ***********************************/

var BootStrapC2C = function(options) {
    options = Object(options);

    /**
     * Messages to be read out-loud to a client who is using screen-reader when the user focuses (tabs over) the Click2Chat
     * button.
     *
     * @type {{resume: string, start: string, end: string}}
     */
    this.accessibilityMessages = {
        end: "End Chat",
        resume: "Resume Chat",
        start: "Start Chat",
        onMinimize: "Chat window minimized. To resume, select chat button or press alt plus 1",
        newMessageSingular: "You have {count} unread message.",
        newMessagePlural: "You have {count} unread messages.",
        onDisplay: "Chat available, press ALT plus 1 to open",
        openChat: "Chat window open, press ALT plus 2 to minimize and ALT plus 9 to end chat."
    };
    for (var prop in options.accessibilityMessages) {
         this.accessibilityMessages[prop] = options.accessibilityMessages[prop];
     }

    this.animate  = typeof options.animate == "undefined"? true : options.animate;
    this.animateDelay = options.animateDelay || 1000;
    this.c2cR = options.right || 30;
    this.c2cB = options.bottom || 30;
    this.width = options.width || 50;
    this.height = options.height || 50;
    this.backgroundRColor = options.readyBackgroundColor;
    this.backgroundRImage = options.readyBackgroundImageURL;
    this.backgroundAHColor = options.afterHoursBackgroundColor;
    this.backgroundAHImage = options.afterHoursBackgroundImageURL;
    this.backgroundDColor = options.disabledBackgroundColor;
    this.backgroundDImage = options.disabledBackgroundImageURL;
    this.backgroundBColor = options.buzyBackgroundColor;
    this.backgroundBImage = options.buzyBackgroundImageURL;
    this.backgroundMColor = options.minimizedBackgroundColor;
    this.backgroundMImage = options.minimizedBackgroundImageURL;
    this.closeBtn = typeof options.closeBtnOnActive == "undefined"? true : options.closeBtnOnActive;
    this.htmlRContent = options.readyHtmlContent;
    this.htmlDContent = options.disabledHtmlContent;
    this.htmlAHContent = options.afterHoursHtmlContent;
    this.htmlBContent = options.buzyHtmlContent;
    this.htmlMContent = options.minimizedHtmlContent;
    this.flyInOpener = typeof options.flyInWelcomePopup == "undefined"? false : options.flyInWelcomePopup;
    this.flyInOpenerMsg = options.flyInWelcomeMsg || "We are here, lets Chat!" ;
    this.useOpener = options.useOpenerForWelcomeMsg;
    this.flyInHeader = options.flyInHeader || "Bot Support" ;
    this.flyInDelay = options.flyInWelcomeDelay || 3000;
    this.flyInUrl = options.flyInAvatarUrl;
    this.flyInW = options.flyInAvatarWidth || 30;
    this.flyInH = options.flyInAvatarHeight || 30;
    this.showMinimizedBadge = typeof options.showMinimizedBadge == "undefined"? true: options.showMinimizedBadge;
    this.showFlyinMinimizedMessage =  typeof options.showFlyinMinimizedMessage == "undefined"? true: options.showFlyinMinimizedMessage;
    this.allowDragging = typeof options.dragEnabled == "undefined"? true : options.dragEnabled;
    this.parentElement = options.parentElement;
    this.richPayload = options.openerWidget;
    this.openerWidgetCallback = options.openerWidgetCallback;
    this.minPayload = options.minimizedWidget;
    this.minWidgetCallback = options.minimizedWidgetCallback;

    /*
    * Function.prototype.bind creates a new function instance,
    * Need to keep a reference or else removeEventListener cannot remove
    */
    this.onC2CClickedBind = this.onC2CClicked.bind(this);
    this.onC2CKeyPressedBind = this.onC2CKeyPressed.bind(this);
    this.onC2CKeydownBind = this.onC2CKeydown.bind(this);
    
    this.ariaReaderAlert = new this.ariaReader({
       cssName: 'alerts',
       initMsg: this.accessibilityMessages.onDisplay,
       role: 'alert'
    });
    this.ariaReaderStatus = new this.ariaReader({
       cssName: 'status',
       role: 'status'
    });

    this.isChatLoadedOnce = false;
    this.isChatDisplayedOnce = false;
 }

 /**
    Nuance Messaging C2C button can be in one of the following states
    {
       disabled: "d", 
       chatactive:"d", 
       busy: "b", 
       afterHours: "ah", 
       ready: "r"
    } 
 **/

 BootStrapC2C.prototype.renderC2CButton = function (c2cData, isDisplay) {
    var el,bc, bi, hc = "";
    this.c2cData = c2cData;
    this.didShow = true;
    if(this.eDiv) {
       el = this.eDiv;
       this.resetState();
    } else {
       el = document.createElement("button");
       el.classList.add("nuance-chat-button");
       el.style.right = this.c2cR + "px";
       el.style.bottom = this.c2cB + "px";
       el.style.width = this.width + "px";
       el.style.height = this.height + "px";
       if(this.animate) {
          el.classList.add("animate");
       }
       this.parentElement.appendChild(el);
       if(!this.allowDragging) {
          el.style.position = "fixed";
       }
       this.eDiv = el;
    
       // Init aria readers
       this.ariaReaderStatus.setParent(this.parentElement, true);
       this.ariaReaderAlert.setParent(this.parentElement, true);
    }

    if(this.animate) {
       setTimeout(function() {
          applyStyle.call(this);
          el.classList.add('enter');
       }.bind(this), this.animateDelay)
    } else {            
       applyStyle.call(this);
       el.classList.add('enter');
    }
    
    el.idx=c2cData.c2cIdx;

    if (c2cData.launchable || c2cData.displayState == "chatactive" && this.closeBtn) {            
       el.addEventListener("click", this.onC2CClickedBind);
       el.addEventListener("keydown", this.onC2CKeydownBind);

       window.addEventListener("keydown", this.onC2CKeyPressedBind);
    }

    function applyStyle() {
       el.classList.remove("ready","afterHours", "disabled", "buzy", "minimized");
       el.innerHTML = "";
       switch(c2cData.image) {
          case "r":
             this._setC2CButtonAccessibilityMessage(this.accessibilityMessages.start);
             el.classList.add("ready");
             bc = this.backgroundRColor;
             bi = this.backgroundRImage;
             hc = this.htmlRContent || "<span class='chat-icon'></span>";

                if (!this.isChatLoadedOnce) {
             this.ariaReaderAlert.setMessage(this.accessibilityMessages.onDisplay);
                   this.isChatLoadedOnce = true;
                }

             if(this.flyInOpener && !c2cData.reDisplay) {
                var  that = this;
                this.flyInTimer = setTimeout(function() {
                   that.displayFlyInOpener();
                   if(that.flyInOpenerMsg && !that.useOpener) {
                         that.flyInContent(that.flyInUrl,that.flyInW,that.flyInH,that.flyInOpenerMsg);
                   } else if(c2cData.opID && that.useOpener) {
                      NuanMessaging.CIAPI.getOpenerScripts(function(data) {
                         var parser = new DOMParser();
                         var xmlDoc = parser.parseFromString(data,"text/xml");
                         
                         that.flyInContent(that.flyInUrl,that.flyInW,that.flyInH,xmlDoc.getElementsByTagName("script")[0].textContent);
                      }, c2cData.opID);
                   }
                   if(that.richPayload) {
                      that.renderRichWidgetInOpener(that.richPayload, that.openerWidgetCallback)
                   }
                },this.flyInDelay);
                
             }
             if (c2cData.reDisplay) {
                el.focus();
             }
          break;
          case "ah":                 
             el.classList.add("afterHours");
             bc = this.backgroundAHColor;
             bi = this.backgroundAHImage;
             hc = this.htmlAHContent;
          break;
          case "d":
             el.classList.add("disabled");   
             bc = this.backgroundDColor;
             bi = this.backgroundDImage;
             if(this.closeBtn) {
                el.setAttribute("tabindex","0");
                hc =  this.htmlDContent || "<span class='chat-close'></span>";
                   if (isDisplay){
                this.ariaReaderAlert.setMessage(this.accessibilityMessages.openChat);
                      this.isChatDisplayedOnce = true;
                   }
                   else {
                      this._setC2CButtonAccessibilityMessage(this.accessibilityMessages.end);
                   }
             } else {
                hc = this.htmlDContent;
             }

          break;
          case "b":
             el.classList.add("buzy");  
             bc = this.backgroundBColor;
             bi = this.backgroundBImage;
             hc = this.htmlBContent;
          break;
          case "m":
             this._setC2CButtonAccessibilityMessage(this.accessibilityMessages.resume);
             el.setAttribute("tabindex","0");
             el.classList.add("minimized");
             bc = this.backgroundMColor;
             bi = this.backgroundMImage;
             hc =  this.htmlMContent || "<span class='chat-minimize'></span>"
             
             this.ariaReaderStatus.setMessage(this.accessibilityMessages.onMinimize);

             // Change initial message if unread messages present.
             this.setAriaNewUnreadMessage(c2cData.count || 0);

             if(this.showMinimizedBadge) {
                this.countEl = null;
                hc += this.addMinimizedBadge(c2cData.count || 0);
             }
             if (!c2cData.reDisplay) {
                setTimeout(function() {
                   el.focus();  
                }, 250);
             }
          break;
          default:                  
             el.setAttribute("tabindex","-1");
             bc = "transparent";
          break;
       }

       if(hc) {
          el.innerHTML = hc;
       }
       if(bc) {
          el.style.background = bc;
       }
       if(bi) {
          el.style.background = ["url('",bi,"')"].join("");
       }  

       if(!bi && !bc) {
          el.style.removeProperty("background");
       }
    }
 };

/**
 * ARIA reader for new message alerts.
 * Creates the initial html and provides a way to update the messages
 * @param {Object} options - Reader options 
 * @property {string} initMsg - Initial message to set in aria-live div.
 * @property {string} role - ARIA role to set to aria-live div.
 */
BootStrapC2C.prototype.ariaReader = function(options) {
    options = options || {};
    var _parentEl;
    var _initMsg = _lastMsg = "";
    var _role = "log";
    var _cssSubName = "";
    if(options.initMsg){
        _initMsg = options.initMsg
    }
    if(options.role){
        _role = options.role
    }
    if(options.cssName){
        _cssSubName = options.cssName;
    }

    function initReader() {
        var ar = getReaderEl();
        if (!ar) {
            var doc = new DOMParser().parseFromString(getHtml(), 'text/html');
            _parentEl.appendChild(doc.body.firstChild);
        }
    }

    function getHtml(){
      var msg = _lastMsg || _initMsg;
        return "<div class='aria-reader " + _cssSubName + "' role='"+_role+"' aria-live='polite'>" + msg + "</div>";
    }
    function setParent(el, alsoInitReader){
        _parentEl = el;
        if (alsoInitReader) {
          initReader();
        }
    }
    function getReaderEl(){
      if (_parentEl) {
          return _parentEl.querySelector(".aria-reader" + (_cssSubName ? ("."+ _cssSubName) : ""));
      }
    }
    function setMessage(message){
      var el = getReaderEl();
      if (el) {
          el.style.display = '';
          el.innerHTML = message;
          // reset the message to avoid aria reader navigation
          setTimeout(function(){
              el.style.display = 'none';
          }, 1500);
      }
      _lastMsg = message;
    }
   function reset(){
      var el = getReaderEl();
      if (el) {		 
          el.innerHTML = "";
      }
   }

    return{
        getHtml: getHtml,
        setParent: setParent,
        setMessage: setMessage,
      reset : reset
    };
};

BootStrapC2C.prototype.setAriaNewUnreadMessage = function(count) {
    if (count <= 0) {
       return;
    }
    var msg = this.accessibilityMessages.newMessageSingular;
    if (count > 1) {
       msg = this.accessibilityMessages.newMessagePlural;
    }
    msg = msg.replace("{count}", count);
    this.ariaReaderStatus.setMessage(msg);
 };

 /**
    This method fires when Nuance Framework changes the c2c state , for example from buzy to ready
 **/
 BootStrapC2C.prototype.renderState = function(image, data){
    this.c2cData.image = image;
    this.c2cData.launchable = data.launchable;
    this.renderC2CButton(this.c2cData, !this.isChatDisplayedOnce);
 };

 BootStrapC2C.prototype.getHeight = function() {
    return this.c2cB + this.height + 20
 };

/**
    This method fires when Nuance Framework determines when c2c needs to be disabled, for example when chat is launched
 **/

 BootStrapC2C.prototype.showDisabled = function() {
    this.c2cData.image = "d";
    this.c2cData.launchable = false;
    this.renderC2CButton(this.c2cData, !this.isChatDisplayedOnce);
 };

 BootStrapC2C.prototype.setParentElement = function(el) {
    this.parentElement = el;
 };

 BootStrapC2C.prototype.resetState = function() {
    this.eDiv.classList.remove('enter');
    this._setC2CButtonAccessibilityMessage("");
    this.eDiv.setAttribute("tabindex","-1");
 };

 BootStrapC2C.prototype.isDisplayed = function() {
    return this.didShow;
 };

 /**
  * Handels C2C Button Click
  */
  BootStrapC2C.prototype.onC2CClicked = function() {
    if(this.closeBtn && this.c2cData.image == "d") {
       this.onClose();
    } else if(this.c2cData.image == "r") {
       NuanMessaging.CIAPI.onC2CClicked(this.c2cData.c2cIdx); 
       if(this.flyInTimer != -1) {
          clearTimeout(this.flyInTimer);
       }
       
    } else if(this.c2cData.image == "m") {
       NuanMessaging.SDKAPI.onRestoredClicked();
       this.c2cData.count = 0; 
    }

    this.flyInClose();
 };

  BootStrapC2C.prototype.onC2CKeydown = function(event) {
    if(event.keyCode == 13){
       this.onC2CClicked();
    }
 };

 BootStrapC2C.prototype.addMinimizedBadge = function(count) {
    return ["<div aria-hidden='true' class='badge",count>0?" bounce":"","'><div class='message-count'>",count,"</div></div>"].join("");
 };

 BootStrapC2C.prototype.newMinimizedMessage = function(count,msgObject) {
    if(this.showMinimizedBadge) {
        if(!this.countEl) {
          var badgeEl = this.eDiv.querySelector(".badge");
          if(!badgeEl.classList.contains("bounce")) {
               badgeEl.classList.add("bounce"); 
          }
          this.countEl = badgeEl.querySelector(".message-count");
        }
        this.countEl.innerText = count;
    } 
    if (msgObject && msgObject.data) {
      var text = msgObject.data["chatFinalText"] || msgObject.data["messageText"];
      if (this.showFlyinMinimizedMessage && text) {        
           var animate = false;
           if(!this.flyel) {
               this.displayFlyInOpener();     
               if(this.minPayload) {
                  this.renderRichWidgetInOpener(this.minPayload, this.minWidgetCallback)
               }          
           }  else {
            animate = true;
           }
           this.flyInContent(this.flyInMinImgUrl,this.flyInW,this.flyInH,text.replace("href","href=\"javascript:void(0)\""),animate);
      }
    }

    // Aria-live status message update.
    this.setAriaNewUnreadMessage(count);
 };

 BootStrapC2C.prototype.displayFlyInOpener = function() {
    var fragment  = document.createDocumentFragment();
    var flyel = document.createElement("div");
    flyel.classList.add("nuan-flyin-opener");
    flyel.style.right = this.c2cR + (this.width/2) + "px";
    flyel.style.bottom = this.c2cB + this.height + 20 + "px";
    var htmls = ["<div class='closeBtnCont'><div class='flyin-close-btn' tabindex='0' role='button'><svg width='10px' height='10px' viewBox='0 0 14 14'><g stroke='none' stroke-width='1' fill='none' fill-rule='evenodd'><g transform='translate(-419.000000, -413.000000)'><g transform='translate(164.000000, 396.000000)'><g><g transform='translate(250.000000, 12.000000)'><g><g><rect opacity='0.200000003' x='0' y='0' width='24' height='24'></rect><g transform='translate(4.000000, 4.000000)' fill='#000000'><rect transform='translate(8.000000, 8.000000) rotate(45.000000) translate(-8.000000, -8.000000) ' x='7' y='-1' width='2' height='18' rx='1'></rect><rect transform='translate(8.000000, 8.000000) rotate(135.000000) translate(-8.000000, -8.000000) ' x='7' y='-1' width='2' height='18' rx='1'></rect></g></g></g></g></g></g></g></g></svg></div></div>","<div class='flyInHeader'><strong>",this.flyInHeader,"</strong></div>"];
   
    htmls.push("<div class='opener-container'> </div></div>");
    
    flyel.innerHTML = htmls.join("");

    fragment.appendChild(flyel);
    flyel.addEventListener("click", this.flyInClose.bind(this));
    this.flyel = flyel;
    this.parentElement.appendChild(fragment);
    setTimeout(function(){
       flyel.classList.add('enter');   
    },this.animateDelay);
 };

 BootStrapC2C.prototype.flyInContent = function(imgUrl, imgW, imgH , content, animate) {

    var opnrCntr = this.flyel.querySelector(".opener-container")
    var html = ["<div class='flyinOpenerContainer",animate?" animate":"","'>"];
    if(imgUrl) {
       html.push("<div class='flyInMsgAwatarCont'>");
       html.push("<img class='flyInMsgAwatar' src=",imgUrl," width=", imgW, " height=", imgH,">");
       html.push("</div>");
    }
    html.push("<div class='flyin-bubble-msg-container' style='margin-left:px;'><div class='flyin-bubble-text'>",content,"</div></div></div>");
    
    //this.flyel.insertAdjacentHTML('beforeend', html.join("")); 
    opnrCntr.insertAdjacentHTML('beforeend', html.join("")); 

    if(animate) {
       setTimeout(function(){
          opnrCntr.lastChild.classList.add('enter');   
       }.bind(this),this.animateDelay);
    }
 };

 BootStrapC2C.prototype.resetBadge = function(){
    if(this.countEl){
       this.countEl.innerText = "0";
    }
 };

 BootStrapC2C.prototype.renderRichWidgetInOpener = function(richWidgetPayload, actionCallback) {
     var container = document.createElement("div");
     //container.classList.add("flyinOpenerContainer");
     container.classList.add("flyin-widget");
     var instance = RichMain.instance.renderRichContent(richWidgetPayload,container, "", false);
     instance.registerCBListener(function(msg){
        actionCallback && actionCallback(msg, this.c2cData);
        this.flyInClose();
     }.bind(this));
     this.flyel.appendChild(container);
 };

 BootStrapC2C.prototype.flyInClose = function() {
   if(this.flyel) {
       this.flyel.parentNode.removeChild(this.flyel);
       this.flyel = null;
    }
 };

 BootStrapC2C.prototype.onClose = function() {
    NuanMessaging.CIAPI.confirmAndClose(); 
 };

 BootStrapC2C.prototype.clearListeners = function() {
    this.eDiv.removeEventListener("click", this.onC2CClickedBind);
    this.eDiv.removeEventListener("keydown", this.onC2CKeydownBind);
    window.removeEventListener("keydown", this.onC2CKeyPressedBind);
 };

 BootStrapC2C.prototype.clear = function() {
    this.didShow = false;
    this.resetState();
    if(this.flyInTimer != -1) {
       clearTimeout(this.flyInTimer);
    }
    this.flyInClose();
 };

 BootStrapC2C.prototype.isCloseBtnDisplayed = function() {
    return this.closeBtn;
 }

 /**
  * Set the accessibility message for the Click2Chat button, so that when a user who is using a screen-reader
  * tabs over to the C2C button it will announce sentences such as: "Start Chat", "Resume Chat", "End Chat"
  *
  * @param {string} accessibilityMessage
  * @returns {undefined}
  * @private
  */
 BootStrapC2C.prototype._setC2CButtonAccessibilityMessage = function (accessibilityMessage) {
     this.eDiv.setAttribute("title", accessibilityMessage);
 };

 /**
  * Called When Key combination or single Key pressed on c2c Button
  * @param event
  */
 BootStrapC2C.prototype.onC2CKeyPressed = function (event) {
    var DIGIT_NINE_CODE = 57, DIGIT_ONE_CODE = 49, DIGIT_TWO_CODE = 50;
    var STATE_READY = "r", STATE_MINIMIZED = "m";
    if (event.altKey && event.keyCode === DIGIT_NINE_CODE) {
       // Do Nothing if chat is minimized
       if (this.c2cData.image !== STATE_MINIMIZED) {
          this.onClose();
       }
    }
    if (event.altKey && event.keyCode === DIGIT_ONE_CODE) {
       if (this.c2cData.image === STATE_READY) {
          NuanMessaging.CIAPI.onC2CClicked(this.c2cData.c2cIdx);
          if (this.flyInTimer != -1) {
             clearTimeout(this.flyInTimer);
          }
       } else if (this.c2cData.image === STATE_MINIMIZED) {
          NuanMessaging.SDKAPI.onRestoredClicked();
          this.c2cData.count = 0;
       }
    }
    if (event.altKey && event.keyCode === DIGIT_TWO_CODE) {
       NuanMessaging.SDKAPI.ciMinimize();
    }
    this.flyInClose();
 };

/************************** End Custom Bootstrap controlled C2C rendering logic ***********************************/
