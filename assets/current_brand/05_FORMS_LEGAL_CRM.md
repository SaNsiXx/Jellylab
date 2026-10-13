# Jelly Labs — Forms, Legal and CRM Specification

## 1. Formularz B2B: Jelly List / Jelly Drop

### Pola

- First name / Imię
- Last name / Nazwisko
- Company / Firma
- Role / Stanowisko
- Business email / Służbowy e-mail
- Phone / Telefon — opcjonalnie
- What do you need? / Czego potrzebujesz?
  - Frontend
  - Backend
  - DevOps & Cloud
  - Data & AI
  - QA
  - eCommerce
  - Dedicated team
  - Not sure yet
- Timeline / Termin:
  - Immediately
  - 2–4 weeks
  - 1–3 months
  - Just exploring
- Interested in:
  - Jelly Drop
  - The Jelly Signal
  - Both
- Preferred contact:
  - Email
  - Phone

### Zgoda e-mail

Nie może być domyślnie zaznaczona.

> Chcę otrzymywać od **[PEŁNA NAZWA ADMINISTRATORA]** na podany adres e-mail newsletter „The Jelly Signal” oraz informacje handlowe i marketingowe dotyczące usług Jelly Labs. Wiem, że zgodę mogę wycofać w każdym czasie.

EN:

> I would like to receive “The Jelly Signal” newsletter and commercial and marketing information about Jelly Labs services from **[FULL CONTROLLER NAME]** at the email address provided. I understand that I may withdraw my consent at any time.

### Zgoda telefoniczna

Osobna, opcjonalna i niezaznaczona.

> Wyrażam zgodę na kontakt telefoniczny przez **[PEŁNA NAZWA ADMINISTRATORA]** w celu przedstawiania informacji handlowych i marketingowych dotyczących usług Jelly Labs. Wiem, że zgodę mogę wycofać w każdym czasie.

### Informacja pod formularzem

> Administratorem danych jest **[PEŁNA NAZWA, ADRES]**. Informacje o celach, podstawach, okresach przetwarzania i przysługujących prawach znajdują się w [Polityce prywatności].

### CTA

- EN: **JOIN THE JELLY LIST**
- PL: **DOŁĄCZ DO JELLY LIST**

### Po wysłaniu

1. Pokaż ekran „One more step”.
2. Wyślij wiadomość double opt-in.
3. Po potwierdzeniu oznacz rekord jako `marketing_email_confirmed=true`.
4. Wyślij Jelly Drop.
5. Jeśli kontakt kwalifikuje się do Jelly Box, wyślij osobny formularz adresu dostawy.

Nie zbieraj pełnego adresu wysyłki w pierwszym publicznym formularzu.

## 2. Formularz klienta: Build Your Crew

### Pola

- Imię i nazwisko
- Firma
- E-mail służbowy
- Telefon — opcjonalnie
- Rola/role
- Liczba osób
- Stack
- Seniority
- Data startu
- Długość współpracy
- Model: remote / hybrid / onsite
- Budżet lub stawka — opcjonalnie
- Opis problemu
- Preferowany kontakt

CTA:

- EN: **SEND THE SIGNAL**
- PL: **WYŚLIJ SYGNAŁ**

Checkbox marketingowy nie może być warunkiem wysłania zapytania ofertowego. Dane z zapytania i zgodę marketingową należy zapisywać oddzielnie.

## 3. Formularz kandydata: Join Jelly Crew

### Pola

- Imię i nazwisko
- E-mail
- Telefon
- Lokalizacja
- LinkedIn
- CV
- Główna rola
- Technologie
- Seniority
- Angielski
- Dostępność
- Preferowana stawka
- Model współpracy
- Zgoda na konkretne procesy rekrutacyjne
- Osobna, opcjonalna zgoda na przyszłe oferty

Nie należy publikować profilu ani przekazywać CV klientowi bez wiedzy i odpowiedniej podstawy prawnej.

## 4. Jelly Box

Publiczny skrót zasad:

- oferta dla zweryfikowanych kontaktów B2B,
- jedna paczka na firmę,
- limitowana pula, np. pierwsze 50 poprawnie zweryfikowanych zgłoszeń,
- wysyłka na adres firmowy w Polsce,
- brak ekwiwalentu pieniężnego,
- zgłoszenia prywatne, duplikaty i niepełne dane mogą zostać odrzucone,
- pełny regulamin dostępny przy formularzu.

Adres wysyłki:

- zbierać dopiero po double opt-in i kwalifikacji,
- przechowywać oddzielnie,
- usunąć po okresie określonym w polityce retencji, o ile nie istnieje inna podstawa przechowywania.

## 5. Dane zapisywane przy każdym formularzu

- timestamp UTC,
- źródło i referrer,
- UTM source, medium, campaign, content, term,
- język formularza,
- typ formularza,
- dokładna treść każdej zgody,
- wersja zgody,
- stan checkboxa,
- data double opt-in,
- IP wyłącznie po decyzji prawnej i opisaniu celu,
- status CRM,
- owner leada,
- data ostatniego kontaktu,
- status Jelly Box.

## 6. CRM

Rekomendowane mapowanie do Pipedrive:

### Person

- name,
- email,
- phone,
- language,
- marketing email consent,
- phone consent,
- consent timestamp/version.

### Organization

- company name,
- domain,
- country,
- company size,
- client type: software house / product company / enterprise.

### Lead/Deal

- source: website,
- campaign: jelly_list,
- technology need,
- timeline,
- number of specialists,
- preferred contact,
- UTM,
- Jelly Drop status,
- Jelly Box status.

### Pipeline

1. New Jelly Signal
2. Email confirmed
3. Qualified B2B
4. Need identified
5. Profiles sent
6. Interview
7. Won / Lost / Nurture

## 7. Automatyzacje

1. Formularz → CRM.
2. Double opt-in → lista mailingowa.
3. Potwierdzenie → wysyłka Jelly Drop.
4. Qualified B2B → zadanie dla sprzedaży w ciągu 1 dnia roboczego.
5. Jelly Box approved → prośba o adres dostawy.
6. Brak potwierdzenia → jedno przypomnienie, potem stop.
7. Wypisanie → natychmiastowa synchronizacja statusu.

## 8. Bezpieczeństwo

- walidacja po stronie klienta i serwera,
- rate limiting,
- honeypot,
- CAPTCHA uruchamiana adaptacyjnie,
- skanowanie uploadowanych CV,
- sekrety wyłącznie w zmiennych środowiskowych,
- logi bez nadmiarowych danych osobowych,
- polityka retencji i usuwania,
- role i ograniczony dostęp w CRM.

## 9. Blokery przed produkcją

Trzeba uzupełnić i zatwierdzić:

- prawdziwą nazwę administratora danych,
- adres, KRS, NIP i kontakt,
- politykę prywatności,
- cookie policy i consent manager,
- regulamin Jelly Box,
- okresy retencji,
- dostawców hostingu, CRM, e-mail i analityki,
- umowy powierzenia,
- finalną treść zgód z prawnikiem lub IOD.

Ten dokument jest specyfikacją wdrożeniową, a nie indywidualną opinią prawną.

