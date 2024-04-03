function getResolution() {
    document.getElementById("pixelW").value = Math.round(window.screen.width * window.devicePixelRatio);
    document.getElementById("pixelH").value = Math.round(window.screen.height * window.devicePixelRatio);
}
window.onload = getResolution()

function calc() {
        
    var pixelW, pixelH, inchD    
    pixelW = document.getElementById("pixelW").value
    pixelH = document.getElementById("pixelH").value
    inchD = document.getElementById("inchD").value

    if (inchD > 0) {

        //result section

        //calculate ppi & physical size
        
        var ppi, scaledPPI, mmW, mmH, equivPPI
        ppi = Math.sqrt(Math.pow(pixelW, 2) + Math.pow(pixelH, 2)) / inchD
        scaledPPI = Math.sqrt(Math.pow(window.screen.width, 2) + Math.pow(window.screen.height, 2)) / inchD
        mmW = pixelW / ppi * 25.4
        mmH = pixelH / ppi * 25.4
        document.getElementById("cmW").textContent = "（" + Math.round(mmW) / 10 + " 厘米）"
        document.getElementById("cmH").textContent = "（" + Math.round(mmH) / 10  + " 厘米）"
        document.getElementById("cmD").textContent = "（" + Math.round(inchD * 25.4) / 10 + " 厘米）"
        if (document.getElementById("isPenTile").checked == false) {
            document.getElementById("ppi").textContent = "PPI=" + Math.round(ppi)
        }   else {
            equivPPI = ppi * Math.sqrt(2/3)
            document.getElementById("ppi").textContent = "PPI=" + Math.round(equivPPI) + "（PenTile等效）"
        }
        document.getElementById("result").style.display = "inherit"
        
        //guess device type

        var mmShorter, scaleFacLgr, scaleFacMore, meterRetina, meterImmerse, meterMax
        if (parseFloat(mmW) <= parseFloat(mmH)) {
            mmShorter = mmW
        }   else {
            mmShorter = mmH
        }

        switch (true) {
        case mmShorter >= 40 && mmShorter < 90:         //Mobile Phone
            var phoneFactors = [/*240p*/0.75, /*320p*/1.0, /*480p*/1.5, /*576p,640p,720p*/2.0, /*720p,SurfaceDuo*/2.5, /*1080p*/2.625, /*1080p*/2.75, /*1080p,palm*/3.0, /*1440p*/3.5, /*1440p*/3.66, /*1440p*/4.0, /*2160p*/5.25, /*2160p*/5.5, /*2160p*/6.0]
            scaleFacLgr = roundToArray(ppi / 144, phoneFactors) * 100
            scaleFacMore = roundToArray(ppi / 160, phoneFactors) * 100
            break
        case mmShorter >= 90 && mmShorter < 135:        //7~9" Tab
            scaleFacLgr = Math.round(ppi / 132 * 4) * 25
            scaleFacMore = Math.round(ppi / 150 * 4) * 25
            break
        case mmShorter >= 135 && mmShorter < 155:       //10" Tab
            scaleFacLgr = Math.round(ppi / 128 * 4) * 25
            scaleFacMore = Math.round(ppi / 144 * 4) * 25
            break
        case mmShorter >= 155 && mmShorter < 245:       //Laptop
            scaleFacLgr = Math.round(ppi / 120 * 4) * 25
            scaleFacMore = Math.round(ppi / 135 * 4) * 25
            break
        case mmShorter >= 245 && mmShorter < 450:       //Desktop Monitor
            scaleFacLgr = Math.round(ppi / 96 * 4) * 25
            scaleFacMore = Math.round(ppi / 120 * 4) * 25
/*          meterRetina = 
            meterImmerse = 
            meterMAX = 
*/          break
        case mmShorter >= 450:                          //TV, Projector, IMAX...
            scaleFacMore = scaleFacLgr = 100
/*          meterRetina = 
            meterImmerse = 
            meterMAX = 
*/          break
        default:
            scaleFacMore = scaleFacLgr = 100
        }

        // recommend seciton

        if (scaleFacLgr > 100) {                  //hidpi device
            document.getElementById("tooLow").textContent = ""
            if (scaleFacMore < 100) {
                scaleFacMore = 100
            }
            document.getElementById("scaleFacLgr").textContent = scaleFacLgr + "%"
            document.getElementById("scaleFacMore").textContent = scaleFacMore + "%"
            document.getElementById("resLgr").textContent = Math.round(pixelW / scaleFacLgr * 100) + "×" + Math.round(pixelH / scaleFacLgr * 100)
            document.getElementById("resMore").textContent = Math.round(pixelW / scaleFacMore * 100) + "×" + Math.round(pixelH / scaleFacMore * 100)
            
            document.getElementById("recommend").style.display = "inherit"

        }   else {                  //lowdpi device
            document.getElementById("recommend").style.display = "none"
            switch (true) {          //dpi too low
            case ppi < 42 && mmShorter >= 450:
                document.getElementById("tooLow").innerHTML = "<br>建议拉远距离观看"
                break
            case ppi < 85 && mmShorter < 450:
                document.getElementById("tooLow").innerHTML = "<br>建议升级高分屏"
                break
            default:
                document.getElementById("tooLow").textContent = ""
            }
        }

        // thisDevice section


        var isThisDevice = Math.abs(pixelW - Math.round(window.screen.width * window.devicePixelRatio)) + Math.abs(pixelH - Math.round(window.screen.height * window.devicePixelRatio))             // this will allow deviations
        if (  isThisDevice <= 2 ) {

            document.getElementById("scaleFac").textContent = window.devicePixelRatio * 100 + "%"
            document.getElementById("res").textContent = window.screen.width + "×" + window.screen.height

            const elements = document.getElementsByClassName("thisDevice");
            for (const element of elements) {
                const tagName = element.tagName.toLowerCase(); // 获取元素的标签名
              
                switch (tagName) {
                  case 'th':
                  case 'td':
                    element.style.display = 'table-cell'; // 将 display 修改为 table-cell
                    break;
                  default:
                    element.style.display = 'inherit'; // 将 display 修改为 inherit
                }
              }


            var ua = navigator.userAgent
            switch (true) {
                case ua.includes('Windows NT 10'):
                case ua.includes('Windows NT 6.3'):
                case ua.includes('Windows NT 6.2'):
                case ua.includes('Windows NT 6.1'):
                    document.getElementById("officeScaleFac").textContent = Math.round(scaledPPI / 96 * 100) + "%"
                    document.getElementById("officeScale").style.display = "inherit"
                    break
                default:
                    document.getElementById("officeScale").style.display = "none"
            }
        }

    }   else {          //if diagonal size not set
        document.getElementById("recommend").style.display = "none"
        document.getElementById("ppi").textContent = "请输入屏幕对角线长度"
    }
}

document.addEventListener("change", calc)

/*
  Thx to Gav & ncepuzs for the following function
  https://www.gavsblog.com/blog/find-closest-number-in-array-javascript
  https://meta.appinn.net/t/javascript/19118/3
*/

function roundToArray(needle, haystack) {
    return haystack.reduce((a, b) => {
        let aDiff = Math.abs(a - needle);
        let bDiff = Math.abs(b - needle);

        if (aDiff == bDiff) {
            return a > b ? a : b;
        } else {
            return bDiff < aDiff ? b : a;
        }
    });
}

if ('serviceWorker' in navigator) {
    // register service worker
    navigator.serviceWorker.register('service-worker.js');
}