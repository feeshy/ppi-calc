function calc() {

    var pixelW, pixelH, inchD
    pixelW = document.getElementById("pixelW").value
    pixelH = document.getElementById("pixelH").value
    inchD = document.getElementById("inchD").value

    if (inchD > 0) {    //result section

        //calculate ppi & physical size

        var ppi, scaledPPI, mmW, mmH, equivPPI
        ppi = Math.sqrt(Math.pow(pixelW, 2) + Math.pow(pixelH, 2)) / inchD
        scaledPPI = Math.sqrt(Math.pow(window.screen.width, 2) + Math.pow(window.screen.height, 2)) / inchD
        mmW = pixelW / ppi * 25.4
        mmH = pixelH / ppi * 25.4
        document.getElementById("cmW").textContent = Math.round(mmW) / 10 + " cm"
        document.getElementById("cmH").textContent = Math.round(mmH) / 10 + " cm"
        document.getElementById("cmD").textContent = Math.round(inchD * 25.4) / 10 + " cm"

        if (document.getElementById("isPenTile").checked == false) {
            document.getElementById("ppi").textContent = Math.round(ppi) + "PPI"
        } else {
            equivPPI = ppi * Math.sqrt(2 / 3)
            document.getElementById("ppi").innerHTML = Math.round(equivPPI) + "PPI" + `<small style="font-size:1rem; font-weight:normal; color:var(--text-sec)">${lang.penTileHint}</small>`
        }
        document.getElementById("result-card").classList.remove("hidden")

        //guess device type

        var mmShorter, scaleFacLgr, scaleFacMore, meterRetina, meterImmerse, meterMax
        if (parseFloat(mmW) <= parseFloat(mmH)) {
            mmShorter = mmW
        } else {
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
                break
            case mmShorter >= 450:                          //TV, Projector, IMAX...
                scaleFacMore = scaleFacLgr = 100
                break
            default:
                scaleFacMore = scaleFacLgr = 100
        }

        // recommend section

        if (scaleFacLgr > 100) {                  //hidpi device
            document.getElementById("tooLow").textContent = ""
            if (scaleFacMore < 100) {
                scaleFacMore = 100
            }
            document.getElementById("scaleFacLgr").textContent = scaleFacLgr + "%"
            document.getElementById("scaleFacMore").textContent = scaleFacMore + "%"
            document.getElementById("resLgr").textContent = Math.round(pixelW / scaleFacLgr * 100) + "×" + Math.round(pixelH / scaleFacLgr * 100)
            document.getElementById("resMore").textContent = Math.round(pixelW / scaleFacMore * 100) + "×" + Math.round(pixelH / scaleFacMore * 100)

            document.getElementById("recommend").classList.remove("hidden")

        } else {                  //lowdpi device
            document.getElementById("recommend").classList.add("hidden")
            switch (true) {          //dpi too low
                case ppi < 42 && mmShorter >= 450:
                    document.getElementById("tooLow").innerHTML = lang.warnDistance
                    break
                case ppi < 85 && mmShorter < 450:
                    document.getElementById("tooLow").innerHTML = lang.warnUpgrade
                    break
                default:
                    document.getElementById("tooLow").textContent = ""
            }
        }

        // thisDevice section

        var isThisDevice = Math.abs(pixelW - Math.round(window.screen.width * window.devicePixelRatio)) + Math.abs(pixelH - Math.round(window.screen.height * window.devicePixelRatio))             // this will allow deviations
        if (isThisDevice <= 2) {

            document.getElementById("scaleFac").textContent = Math.round(window.devicePixelRatio * 100) + "%"
            document.getElementById("res").textContent = window.screen.width + "×" + window.screen.height
            document.querySelectorAll(".thisDevice").forEach(el => el.classList.remove("hidden"));

            var ua = navigator.userAgent
            switch (true) {
                case ua.includes('Windows NT'):
                    document.getElementById("i18n-office-desc").innerHTML = lang.officeDesc(Math.round(scaledPPI / 96 * 100) + "%")
                    document.getElementById("officeScale").classList.remove("hidden")
                    break
                case ua.includes('Macintosh'):
                    document.getElementById("i18n-office-desc").innerHTML = lang.officeDesc(Math.round(scaledPPI / 72 * 100) + "%")
                    document.getElementById("officeScale").classList.remove("hidden")
                    break
                default:
                    document.getElementById("officeScale").classList.add("hidden")
            }
        } else {
            document.querySelectorAll(".thisDevice").forEach(el => el.classList.add("hidden"));
            document.getElementById("officeScale").classList.add("hidden")
        }

    } else {          //if diagonal size not set
        document.getElementById("recommend").classList.add("hidden")
        document.getElementById("result-card").classList.add("hidden")
        document.getElementById("ppi").textContent = lang.inputHint
    }
}

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