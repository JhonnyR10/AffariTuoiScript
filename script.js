const puppeteer = require("puppeteer");

async function main() {
  const regione = REGIONE;
  const nome = NOME;
  const cognome = COGNOME;
  const citta = CITTA;
  const provincia = PROVINCIA;
  const cittaNascita = CITTA_NASCITA;
  const provinciaNascita = PROVINCIA_NASCITA;
  const telefono = TELEFONO;
  const email = EMAIL;
  const annoNascita = parseInt(ANNO_NASCITA);
  const meseNascita = parseInt(MESE_NASCITA);
  const giornoNascita = parseInt(GIORNO_NASCITA);
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 800 });

  await page.goto(
    "https://www.giocherai.it/giochistudio/nuovo_gioco/registrati.php"
  );

  const dropdownSelector = "#regione"; // Selettore del menu a tendina
  const optionText = regione; // Testo dell'opzione da selezionare

  await selectOptionFromDropdown(page, dropdownSelector, optionText);

  async function selectOptionFromDropdown(page, dropdownSelector, optionText) {
    const optionExists = await page.$eval(
      dropdownSelector,
      (dropdown, text) => {
        const options = dropdown.querySelectorAll("option");
        for (const option of options) {
          if (option.textContent === text) {
            return true;
          }
        }
        return false;
      },
      optionText
    );

    if (optionExists) {
      await page.select(dropdownSelector, optionText);
      console.log(`Opzione "${optionText}" selezionata.`);

      await page.click("#flag_accettoprivacy");
      await page.type("#nome", nome);
      await page.type("#cognome", cognome);
      await page.type("#citta", citta);
      await page.type("#provincia", provincia);
      await page.type("#cittanascita", cittaNascita);
      await page.type("#provincianascita", provinciaNascita);
      await page.type("#telefono", telefono);
      await page.type("#email", email);

      async function setDateInDatepicker(page, year, month, day) {
        const dateInputSelector = "#datanascitacal"; // Selettore dell'input della data
        const dateValue = `0${day}/0${month}/${year}`; // Formato della data

        await page.evaluate(
          (selector, value) => {
            const input = document.querySelector(selector);
            input.value = value;

            // Crea e dispatcha un evento di input
            const event = new Event("input", { bubbles: true });
            input.dispatchEvent(event);
          },
          dateInputSelector,
          dateValue
        );

        // Calcola l'età e popola il campo dell'età
        await page.evaluate(() => {
          const birthDate = new Date(
            document.querySelector("#datanascitacal").value
          );
          const today = new Date();
          let age = today.getFullYear() - birthDate.getFullYear();
          const monthDiff = today.getMonth() - birthDate.getMonth();

          if (
            monthDiff < 0 ||
            (monthDiff === 0 && today.getDate() < birthDate.getDate())
          ) {
            age--;
          }

          const ageInput = document.querySelector("#eta");
          ageInput.value = age;
          ageInput.disabled = false;
        });

        // Apri il datepicker
        await page.focus(dateInputSelector);

        const daySelector =
          ".ui-datepicker-calendar td.ui-datepicker-current-day a.ui-state-default.ui-state-active";

        // Clicca sull'elemento corrispondente al giorno desiderato
        await page.evaluate((selector) => {
          const dayElement = document.querySelector(selector);
          if (dayElement) {
            dayElement.click();
          }
        }, daySelector);

        await page.evaluate(() => {
          return new Promise((resolve) => {
            setTimeout(resolve, 11500);
          });
        });
        // Verifichiamo se il datepicker è stato chiuso
        const calendarVisible = await page.evaluate(() => {
          const calendar = document.querySelector(".ui-datepicker");
          return calendar
            ? window.getComputedStyle(calendar).display !== "none"
            : false;
        });

        if (calendarVisible) {
          console.log(
            "Il datepicker non si è chiuso correttamente dopo il click."
          );
        } else {
          console.log("Il datepicker si è chiuso correttamente dopo il click.");
        }
      }

      // Utilizzo della funzione per impostare la data di nascita e calcolare l'età
      await setDateInDatepicker(page, annoNascita, meseNascita, giornoNascita);
      await page.click("#btn-salva");
    } else {
      console.log(`Opzione "${optionText}" non trovata.`);
      console.log("Il programma ripartirà dopo 30 minuti...");

      // Attendiamo 30 minuti prima di far ripartire il programma
      setTimeout(() => {
        console.log("Ripartizione del programma...");
        main(); // Chiamata alla funzione main per far ripartire il programma
      }, 2 * 60 * 1000); // 30 minuti in millisecondi
    }
  }
}

main();
