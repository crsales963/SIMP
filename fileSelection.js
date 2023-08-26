// Caitlin Sales, 08/20/2023
// Handles choosing between file select and upload and using the selection option

var upload = document.getElementById("upload");
var fileSelect = document.getElementById("selectSheet");
var uploadSelect = document.getElementById("uploadSelect");
var selectComposer = document.getElementById("dropdown_composer");
var selectSheet = document.getElementById("dropdown_sheet");
var selectMusic = document.getElementById("dropdown_music");
var overlayScreen = document.getElementById("overlay");
var selectedPiece = false;
var selectedAudio = false;
var audioWithSelectedPiece = [];
var jsonByComposer = {};

uploadSelect.addEventListener("click", switchFileMethod);
selectSheet.addEventListener("change", updateAudioSelections);
selectMusic.addEventListener("change", loadAudio);
selectComposer.addEventListener("change", updateTracks);

var uploadButtons = upload.querySelectorAll("input");
var fileSelection = fileSelect.querySelectorAll("select");

const directory = "/~yjiang/papers/am23/data/"

function encodeAccentedCharacters(inputString) {
  // Normalize the string to decompose accented characters
  const normalizedString = inputString.normalize("NFD");

  // Replace accented characters with their base character + combining accent
  const encodedString = normalizedString.replace(/[\u0300-\u036f]/g, (match) =>
    encodeURIComponent(match)
  );

  return encodedString;
}

// when page loads, will read and filter csv file
window.addEventListener("load", () => {
  overlayScreen.style.display = "none";
  const file = "Result.csv";
  fetch(file)
    .then((response) => {
      return response.text();
    })
    .then((csvData) => {
      Papa.parse(csvData, {
        header: true,
        complete: (results) => {
          const data = results.data;
          // loops through data and creates JSON appropriately
          for (let i = 0; i < data.length; i++) {
            const item = data[i];
            const composer = item["composer"];
            const track = item["track"];
            const performer = item["artist"];
            if (jsonByComposer[composer] === undefined) {
              jsonByComposer[composer] = {};
            }
            if (jsonByComposer[composer][track] === undefined) {
              jsonByComposer[composer][track] = {};
            }
            if (jsonByComposer[composer][track][performer] === undefined) {
              jsonByComposer[composer][track][performer] = [];
            }
            jsonByComposer[composer][track][performer].push(item);
          }

          if ("undefined" in jsonByComposer) {
            delete jsonByComposer["undefined"];
          }

          delete jsonByComposer["Sergei Rachmaninoff"];

          // sorts composers alphebetically
          const sortedKeys = Object.keys(jsonByComposer).sort();
          for (let i = 0; i < sortedKeys.length; i++) {
            const key = sortedKeys[i];
            var option = document.createElement("option");
            option.text = key;
            selectComposer.add(option);
          }
        },
        error: (error) => {
          console.error(error);
        }
      });
    })
    .catch((error) => {
      console.error(error);
    });
});

// Immediately invoked function to setup select option as default
(function() {
  uploadButtons.forEach((uB) => {
    uB.disabled = true;
  });

  fileSelection.forEach((fB) => {
    fB.disabled = false;
  });

  selectSheet.setAttribute("disabled", "disabled");
  selectMusic.setAttribute("disabled", "disabled");
})();

// Switches file method from upload to select or vice versa
function switchFileMethod() {
  if (uploadSelect.value == "Enable Upload") {
    uploadSelect.value = "Enable Select";
    switchToUpload();
  } else {
    uploadSelect.value = "Enable Upload";
    switchToSelect();
  }
}

// Switches from select to upload
function switchToUpload() {
  upload.style.display = "";
  fileSelect.style.display = "none";

  uploadButtons.forEach((uB) => {
    uB.disabled = false;
  });

  fileSelection.forEach((fB) => {
    fB.disabled = true;
  });

  upload.classList.remove("disabledbutton");
  fileSelect.classList.add("disabledbutton");

  uploadSelect.value = "Enable Select";
}

// Switches from upload to select
function switchToSelect() {
  upload.style.display = "none";
  fileSelect.style.display = "";

  uploadButtons.forEach((uB) => {
    uB.disabled = true;
  });

  fileSelection.forEach((fB) => {
    fB.disabled = false;
  });

  upload.classList.add("disabledbutton");
  fileSelect.classList.remove("disabledbutton");

  if (selectedPiece == false){
    selectSheet.setAttribute("disabled", "disabled");
    selectMusic.setAttribute("disabled", "disabled");
  }
  uploadSelect.value = "Enable Upload";
}

function updateTracks() {
  overlayScreen.style.display = "";
  unloadSheets();
  selectSheet.removeAttribute("disabled");
  selectSheet.selectedIndex = 0;
  $('#dropdown_sheet option:not(:first)').remove();

  $('#dropdown_music option:not(:first)').remove();
  selectMusic.selectedIndex = 0;
  selectMusic.setAttribute("disabled", "disabled");
  selectedPiece = false;
  selectedAudio = false;

  const sortedKeys = Object.keys(jsonByComposer[selectComposer.value]).sort();
  for (let i = 0; i < sortedKeys.length; i++) {
    const key = sortedKeys[i];
    var option = document.createElement("option");
    option.text = key;
    selectSheet.add(option);
  }

  document.getElementById('files').disabled = true;
  document.getElementById('music').disabled = true;
  document.getElementById('inputFile').disabled = true;
  overlayScreen.style.display = "none";
}

// Updates audio selections based on sheet music chosen in select option
function updateAudioSelections() {
  overlayScreen.style.display = "";
  uploadSelect.setAttribute("disabled", "disabled");

  // getting score path of first performer for piece bc is the same for all performers
  var piecePath = Object.values(jsonByComposer[selectComposer.value][selectSheet.value])[0][0]["score_path"];

  unloadSheets();
  selectedPiece = true;

  // load new sheet
  var location = directory + encodeAccentedCharacters(piecePath);

  osmd = new opensheetmusicdisplay.OpenSheetMusicDisplay("osmdCanvas", {
    // set options here
    backend: "svg",
    drawFromMeasureNumber: 1,
    drawUpToMeasureNumber: Number.MAX_SAFE_INTEGER // draw all measures, up to the end of the sample
  });

  osmd
    .load(location)
    .then(
      function() {
        osmd.Zoom = 0.8;
        osmd.render();
        osmd.FollowCursor = true;
        osmd.cursor.hide();

        score_numerator = osmd.Sheet.SourceMeasures[0].ActiveTimeSignature.numerator;
        score_denominator = osmd.Sheet.SourceMeasures[0].ActiveTimeSignature.denominator;

        sheet_loaded = true;
        selectMusic.selectedIndex = 0;
        $('#dropdown_music option:not(:first)').remove();

        selectMusic.removeAttribute("disabled");

        const sortedKeys = Object.keys(jsonByComposer[selectComposer.value][selectSheet.value]).sort();
        for (let i = 0; i < sortedKeys.length; i++) {
          const key = sortedKeys[i];
          var option = document.createElement("option");
          option.text = key;
          selectMusic.add(option);
        }

        uploadSelect.removeAttribute("disabled");

        overlayScreen.style.display = "none";
      }
    );

  document.getElementById('files').disabled = true;
  document.getElementById('music').disabled = true;
  document.getElementById('inputFile').disabled = true;
}

// Loads audio from select option when one is chosen
function loadAudio() {
  overlayScreen.style.display = "";
  unloadAudioText();
  uploadSelect.setAttribute("disabled", "disabled");

  // getting wav path
  var audioPath = jsonByComposer[selectComposer.value][selectSheet.value][selectMusic.value][0]["wav_path"];
  var locationAudio = directory + encodeAccentedCharacters(audioPath);

  // creates wavesurfer object
  wavesurfer = WaveSurfer.create({
      container: '#waveform',
      autoScroll: true,
      height: 80,
      // barWidth: 2,
      // barHeight: 1, // the height of the wave
      // barGap: null, // the optional spacing between bars of the wave, if not provided will be calculated in legacy format.
      waveColor: 'violet',
      progressColor: 'purple',
      normalize: true,
      plugins: [
        WaveSurfer.Timeline.create({}),
        WaveSurfer.Hover.create({
          lineColor: '#000',
          lineWidth: 3,
          labelBackground: '#555',
          labelColor: '#fff',
          labelSize: '10px',
        })
      ]
  });

  regionsws = wavesurfer.registerPlugin(WaveSurfer.Regions.create());

  wavesurfer.load(locationAudio);

  // event handlers for audio
  // when current time changes when audio is paused
  wavesurfer.on('interaction', audioEvent);

  // runs continuously when audio plays
  wavesurfer.on('audioprocess', audioEvent);

  // when waveform loads
  wavesurfer.on('ready', function() {
    var textPath = jsonByComposer[selectComposer.value][selectSheet.value][selectMusic.value][0]["match_path"]
    var textfile = directory + encodeAccentedCharacters(textPath);
    //loads file using jQuery
    jQuery
      .ajax({
        url: textfile,
        dataType: 'text'
      })
      .done(function(res){
        jQuery.each(res.split(/\r?\n/g), function(i, v){
          if (v != ""){
            var newLine = v.replace("\t", " ").trim();
            var newlineSplit = newLine.split(' ');
            textfile_list.push([newlineSplit[1], newlineSplit[0]]);
          }
        });
    });

    selectedAudio = true;
    osmd.cursorsOptions[0].color = "#33e02f";
    osmd.cursor.show();
    hidden = false;

    var currentTime = wavesurfer.getCurrentTime();
    var audioTime = (Math.round(currentTime * 1000)/1000);

    uploadSelect.removeAttribute("disabled");

    overlayScreen.style.display = "none";
  });

  document.getElementById('music').disabled = true;
  document.getElementById('inputFile').disabled = true;
}
