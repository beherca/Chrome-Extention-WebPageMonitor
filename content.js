function mout(e){
    var s = e.target.style;
    s.borderColor=null;
    s.borderWidth = null;
    s.borderStyle = null;

    // var ms = e.target.getAttributeNode("omargin").value.split(' ');
    // s.marginTop = ms[0];
    // s.marginBottom = ms[1];
    // s.marginRight = ms[2];
    // s.marginLeft = ms[3];
}

function mover(e){
    highlight(e.target);
    // var att = document.createAttribute("omargin");       // Create a "class" attribute
    // att.value = [cs.marginTop,cs.marginBottom,cs.marginRight, cs.marginLeft].join(' ');                           // Set the value of the class attribute
    // e.target.setAttributeNode(att); 
    // s.marginTop = (cs.marginTop.replace('px','')*1 - 2) + 'px';
    // s.marginBottom = (cs.marginBottom.replace('px','')*1 - 2) + 'px';
    // s.marginRight = (cs.marginRight.replace('px','')*1 - 2) + 'px';
    // s.marginLeft = (cs.marginLeft.replace('px','')*1 - 2) + 'px';
}

function highlight(t){
    var s = t.style;
    s.borderColor='red';
    s.borderWidth = '2px';
    s.borderStyle = 'solid';
}

function click(e){
    e.preventDefault();

    var t = e.target;
    var p = e.target.parentNode;
    var offset = getOffset(t);
    var poffset = getOffset(p);
    chrome.runtime.sendMessage({command: "set", info:JSON.stringify({
            outerHTML : t.outerHTML,
            id: t.id,
            name : t.name,
            className : t.className,
            x : offset.left,
            y : offset.top,
            parent: {
                id: p.id,
                name: p.name,
                className: p.className,
                outerHTML : p.outerHTML,
                x : poffset.left,
                y : poffset.top
            }
        })
    }, function(response) {
      console.log(response.farewell);
    });
    destroy();
}

function getOffset( el ) {
    var _x = 0;
    var _y = 0;
    while( el && !isNaN( el.offsetLeft ) && !isNaN( el.offsetTop ) ) {
        _x += el.offsetLeft - el.scrollLeft;
        _y += el.offsetTop - el.scrollTop;
        el = el.offsetParent;
    }
    return { top: _y, left: _x };
}

function diff(diffTarget){
    var candidate = function(diffTarget){
        var candidates = [];
        var addCndts = function(cndt, score){
            var isAdd = true;
            for(var i=0;i<candidates.length;i++){
                var obj = candidates[i];
                var ele = obj.ele;
                if(cndt === ele){
                    obj.score += score;
                    isAdd = false;
                    break;
                }
            }
            if(isAdd){
                candidates.push({ele:cndt, score: score});
            }
        }
        if(diffTarget.id){
            var ele = document.getElementById(diffTarget.id);
            if(ele)
                addCndts(ele, 0.9);
        }
        if(diffTarget.name){
            var eles = document.getElementsByName(diffTarget.name);
            if(eles.length == 1){
                var ele = eles[0];
                if(ele)
                    addCndts(ele, 0.8);
            }else{
                for(var i=0;i<eles.length;i++){
                    var ele = eles[i];
                    if(ele)
                        addCndts(ele, 0.7);
                }
            }
        }
        if(diffTarget.className){
            var clsNms = diffTarget.className.split(' ');
            var score = clsNms.length * 0.05;
            var eles = document.querySelectorAll('.'+clsNms.join('.'));
            for(var i=0;i<eles.length;i++){
                var ele = eles[i];
                if(ele)
                    addCndts(ele, 0.4 + score);
            }
        }

        var ele = document.elementFromPoint(diffTarget.x, diffTarget.y);
        addCndts(ele, 0.2);
        return candidates;
    };
    var top = function(candidates){
        var top = null;
        for(var i=0;i<candidates.length;i++){
            var obj = candidates[i];
            var score = obj.score;
            if(top == null || top.score < score){
                top = obj;
            }
        }
        return top.ele;
    }
    var compare = function(canEle){
        if(canEle.outerHTML != diffTarget.outerHTML){
            console.log(canEle.outerHTML);
            console.log(diffTarget.outerHTML);
            return true;
        }
        return false;
    };
    if(diffTarget){
        console.log(diffTarget);
        var candi = candidate(diffTarget);
        var topEle = top(candi);
        highlight(topEle);
        var isDiff = compare(topEle);
        return isDiff;
    }
}

function init(){
    document.addEventListener('mouseover', mover);
    document.addEventListener('mouseout', mout);
    document.addEventListener('click', click);
}

function destroy(){
    document.removeEventListener('mouseover',mover);
    document.removeEventListener('mouseout',mout);
    document.removeEventListener('click'.click);
}

function callback(request, sender, sendResponse) {
    console.log(sender.tab ?
                "from a content script:" + sender.tab.url :
                "from the extension");
    // if (request.greeting == "hello")
    //   sendResponse({farewell: "goodbye"});
    if(request.command === "init"){
        init();
        sendResponse();
    }else if(request.command === "destroy"){
        destroy();
        sendResponse();
    }else if(request.command === "diff"){
        var isDiff = diff(JSON.parse(request.diffTarget));
        sendResponse({isDiff:isDiff});
    }
}

chrome.runtime.onMessage.addListener(callback);