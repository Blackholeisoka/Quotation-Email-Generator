#!/usr/bin/env node

import inquirer from "inquirer";
import {readFile} from 'fs/promises';
import puppeteer from 'puppeteer';
import path, { dirname } from 'path';
import { fileURLToPath } from "url";
import dotenv from 'dotenv';
dotenv.config();
import { sendMail } from "./send_quote.js";
import { isAlreadyClient } from "./isAlreadyClient.js";
const data = await readFile('./articles.json', 'utf-8');
const articles = JSON.parse(data);

const filename = fileURLToPath(import.meta.url);
const __dirname = dirname(filename);
let client = {};
let filePath;
const companyName = 'Amazon.fr';
let textContentMail = '';

async function createDevis(c, d) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

const discountPct = Number(c.discount) || 0;     
const vatPct = Number(c.vat) || 0;               
const otherValueNum = c.other ? Number(c.other.value) || 0 : 0;
const otherUnit = c.other ? String(c.other.unit || '') : '';

let total = 0;
for (let i = 0; i < c.articles.length; i++) {
  const entry = c.articles[i];
  const entryId = (entry && typeof entry === 'object' && entry.id) ? entry.id : entry;
  const found = articles.find(a => a.id === entryId);
  const price = (found && Number(found.price)) || (entry && Number(entry.price)) || 0;
  if (!price) console.warn(`Prix introuvable pour l'article #${i+1}`, entry);
  total += price;
}

total = total * (1 - (discountPct / 100));
total = total * (1 + (vatPct / 100));
if (c.other) {
  if (otherUnit.includes('%')) {
    total = total * (1 - (otherValueNum / 100));
  } else {
    total = total - otherValueNum;
  }
}

total = Math.round(total * 100) / 100;

  const devise = c.lang === 'English' ? '$' : '€';

  const articleList = c.articles.map((id, i) => {
    return `<p>• Article #${id.id} n°${i + 1}: ${id.price} ${devise}</p>`;
  }).join('');

  const freeTotal = c.lang === 'English' ? 'Free (0.00 $)' : 'Gratuit (0.00 €)'

  textContentMail = client.lang === 'French' ? `
  Madame, Monsieur,

Nous faisons suite à votre demande et avons le plaisir de vous transmettre ci-joint notre proposition tarifaire dans le cadre de votre projet.

Le devis a été établi sur la base des informations que vous nous avez fournies. Il comprend le détail des prestations, les quantités, les tarifs appliqués, ainsi que nos conditions générales de vente.

La validité de ce devis est précisée dans le document. Toute modification ou ajustement peut être envisagé en fonction de vos éventuelles évolutions de besoin. Nos équipes restent disponibles pour répondre à toute question ou précision complémentaire.

Nous vous remercions pour l'intérêt que vous portez à nos services et restons à votre entière disposition pour la suite de ce dossier.

Dans l’attente de votre retour, nous vous prions d’agréer, Madame, Monsieur, l’expression de nos salutations distinguées.

Cordialement

L’équipe Amazon Business
Sophie Lemoine
Chargée de comptes
pro@amazon.fr
08 05 98 98 00
www.amazon.fr/business
  ` : `Dear Sir or Madam,

Following your request, we are pleased to share with you our pricing proposal for your project.

The attached quotation has been prepared based on the information you provided. It includes a detailed breakdown of the services, quantities, pricing, and our general terms and conditions of sale.

The validity period of the quotation is specified in the document. Should your needs evolve, we remain available to review and adjust our offer accordingly. Our team is at your disposal for any further information or clarification you may require.

We thank you for your interest in our services and remain fully available to support you throughout the process.

We look forward to your response and remain at your service.

Yours sincerely,

Amazon Business Team
Sophie Lemoine
Account Manager
pro@amazon.fr
+33 8 05 98 98 00
www.amazon.fr/business`;

 const html = c.lang === 'English' ? `
  <html>
    <head>
      <style>
        body {
          font-family: Arial, sans-serif;
          max-width: 700px;
          margin: 40px auto;
          padding: 30px;
          border: 1px solid #ccc;
          line-height: 1.6;
          color: #333;
        }
        h1 {
          text-align: center;
          font-size: 22px;
          margin-bottom: 40px;
        }
        p {
          margin: 16px 0;
        }
        .signature {
          margin-top: 50px;
        }
        .signature img {
          height: 80px;
        }

        .logo {
          height: 40px;
        }
      </style>
    </head>
    <body>
      <img class="logo" src="https://logodownload.org/wp-content/uploads/2014/04/amazon-logo.png" />
      <h1>Quotation Summary</h1>

      <p>Dear ${c.firstname} ${c.lastname},</p>

      <p>
        Following your request, we are pleased to provide you with the following quotation dated ${d}.
        This quote includes ${c.articles.length} article${c.articles.length > 1 ? 's' : ''}, as detailed below:
      </p>

      ${articleList}

      <p>
        The quotation includes a discount of ${c.discount}%, VAT at ${c.vat}%, and an additional fee of ${c.other ? `${c.other.value}${c.other.unit}` : '0%'}.
      </p>

      <p>
        The total amount for this quote is <strong>${ total <= 0 ? freeTotal : total.toFixed(2)} ${devise}</strong>.
      </p>

      <p>
        Please let us know if you have any questions or require further information. We remain at your disposal for any clarification or modification you may need.
      </p>

      <p>Best regards,</p>

      <div class="signature">
        <p><strong>${companyName || 'Your Company'}</strong>, 67 Boulevard du Général Leclerc à Clichy</p>
        <img src="https://www.pngall.com/wp-content/uploads/14/Signature-PNG-Free-Image.png" alt="Signature" />
        <p>Authorized Representative</p>
        <p>&copy; Amazon 2025</p>
      </div>
    </body>
  </html>
` : `
  <html>
    <head>
      <style>
        body {
          font-family: Arial, sans-serif;
          max-width: 700px;
          margin: 40px auto;
          padding: 30px;
          border: 1px solid #ccc;
          line-height: 1.6;
          color: #333;
        }
        h1 {
          text-align: center;
          font-size: 22px;
          margin-bottom: 40px;
        }
        p {
          margin: 16px 0;
        }
        .signature {
          margin-top: 50px;
        }
        .signature img {
          height: 80px;
        }

        .logo {
          height: 40px;
        }
      </style>
    </head>
    <body>
      <img class="logo" src="https://logodownload.org/wp-content/uploads/2014/04/amazon-logo.png" />
      <h1>Récapitulatif du devis</h1>

      <p>Bonjour ${c.firstname} ${c.lastname},</p>

      <p>
        Suite à votre demande, nous avons le plaisir de vous transmettre le devis ci-joint daté du ${d}.
        Ce devis comprend ${c.articles.length} article${c.articles.length > 1 ? 's' : ''}, comme indiqué ci-dessous :
      </p>

      ${articleList}

      <p>
        Le devis inclut une remise de ${c.discount}%, une TVA de ${c.vat}%, ainsi que des frais supplémentaires de ${c.other ? `${c.other.value}${c.other.unit === '$' ? devise : '%'}` : '0%'}.
      </p>

      <p>
        Le montant total de ce devis s’élève à <strong>${ total <= 0 ? freeTotal : total.toFixed(2)} ${devise}</strong>.
      </p>

      <p>
        N’hésitez pas à revenir vers nous pour toute question ou information complémentaire. Nous restons à votre disposition pour toute modification éventuelle.
      </p>

      <p>Cordialement,</p>

      <div class="signature">
        <p><strong>${companyName || 'Nom de l’entreprise'}</strong>, 67 Boulevard du Général Leclerc à Clichy</p>
        <img src="https://www.pngall.com/wp-content/uploads/14/Signature-PNG-Free-Image.png" alt="Signature" />
        <p>Représentant autorisé</p>
        <p>&copy; Amazon 2025</p>
      </div>
    </body>
  </html>
`;

  await page.setContent(html);
  filePath = path.join(__dirname, 'devis', `${c.firstname}-${c.lastname}_devis_${getToday()}.pdf`);
  await page.pdf({ path: filePath, format: 'A4' });

  await browser.close();
  console.log(`Quote generated : ${filePath}`);
}

async function main() {
  const baseInfo = await inquirer.prompt([
    {
      type: "input",
      name: "firstname",
      message: "Your first name?",
      validate: (input) => {
        if (!input.trim()) return "First name is required.";
        if (input.length <= 2) return "Must be more than 2 characters.";
        if (/\d/.test(input)) return "No numbers allowed.";
        return true;
      },
    },
    {
      type: "input",
      name: "lastname",
      message: "Your last name?",
      validate: (input) => {
        if (!input.trim()) return "Last name is required.";
        if (input.length <= 2) return "Must be more than 2 characters.";
        if (/\d/.test(input)) return "No numbers allowed.";
        return true;
      },
    },
    {
      type: "input",
      name: "email",
      message: "Your email address?",
      validate: (input) => {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(input) ? true : "Invalid email format.";
      },
    },
    {
      type: "input",
      name: "length",
      message: "How many articles?",
      validate: (input) => {
        const num = Number(input);
        if (!input.trim()) return "Required.";
        if (isNaN(num) || num < 1 || num > 100) return "Between 1 and 100.";
        return true;
      },
    },
  ]);

  client = baseInfo;
  client.articles = [];

  for (let i = 0; i < parseInt(baseInfo.length); i++) {
    const {articleId} = await inquirer.prompt([
      {
        type: "input",
        name: "articleId",
        message: `Enter ID for article #${i + 1} (6 alphanumeric characters):`,
        validate: (input) => {
          if (!input.trim()) return "Required.";
          if (input.length !== 6) return "Exactly 6 characters.";
          if (!/^[a-zA-Z0-9]+$/.test(input)) return "Only letters/digits allowed.";
          const match = articles.find((a) => a.id === input);
          return match ? true : 'No matching article ID found'; 
        },
      },
    ])
    const article = articles.find((a) => a.id === articleId);
    client.articles.push(article);
  }

  const { discount, vat } = await inquirer.prompt([
    {
      type: "input",
      name: "discount",
      message: "The discount (%) to apply?",
      validate: validatePercent,
    },
    {
      type: "input",
      name: "vat",
      message: "The VAT (%) rate?",
      validate: validatePercent,
    },
  ]);

  client.discount = discount;
  client.vat = vat;

  const { applyOther } = await inquirer.prompt([
    {
      type: "confirm",
      name: "applyOther",
      message: "Do you want to apply another percentage (gift card, promo)?",
      default: false,
    },
  ]);

  if (applyOther) {
    const { otherValue, otherUnit } = await inquirer.prompt([
      {
        type: "input",
        name: "otherValue",
        message: "Other percentage value (e.g. 5)?",
        validate: validatePercent,
      },
      {
        type: "list",
        name: "otherUnit",
        message: "Choose the type:",
        choices: ["%", "$"],
      },
    ]);

    client.other = { value: otherValue, unit: otherUnit };
  }

  const { lang } = await inquirer.prompt([
    {
      type: "list",
      name: "lang",
      message: "Your preferred language for the quote?",
      choices: ["English", "French"],
    },
  ]);

  client.lang = lang;
  const subject = client.lang === 'English'
  ? `Subject: Quote prepared for ${client.firstname} ${client.lastname}`
  : `Objet : Transmission du devis à l'attention de ${client.firstname} ${client.lastname}`;

  await createDevis(client, getToday());

  const { send } = await inquirer.prompt([
    {
      type: "confirm",
      name: "send",
      message: "Do you want the quote sent to your email?",
      default: true,
    },
  ]);

  isAlreadyClient(client);
  console.log(`\n- Quote generated(${client.lang}): ${filePath}`);
  if (send) {
    sendMail(client.email, filePath, textContentMail, subject);
    console.log(`- Email sent to: ${client.email}`);
  } else {
    console.log("- Email not sent as per your choice but has been saved.");
  }
}

function validatePercent(input) {
  const num = Number(input);
  if (!input.trim()) return "Required.";
  if (isNaN(num) || num < 0 || num > 100) return "Must be between 0 and 100.";
  return true;
}

function getToday() {
  const d = new Date();
    const timestamp = 
    `${d.getFullYear()}` + `-` +
    `${(d.getMonth() + 1).toString().padStart(2, '0')}` +  `-` + 
    `${d.getDate().toString().padStart(2, '0')}` + 
    `_` +
    `${d.getHours().toString().padStart(2, '0')}` + `-` + 
    `${d.getMinutes().toString().padStart(2, '0')}`;
    return timestamp;
}

main();