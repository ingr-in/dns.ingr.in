
(async function () {

  const providersURL = "https://www.dns.ingr.in/json/providers.json";
  const typesURL = "https://www.dns.ingr.in/json/types.json";

  const domainInput = document.getElementById("domain");
  const providerInput = document.getElementById("provider");
  const typeInput = document.getElementById("type");
  const queryButton = document.getElementById("queryButton");
  const errorContainer = document.getElementById("error-container");
  const outputContainer = document.getElementById("output-container");
  const tipsContainer = document.getElementById("record-tips");

  let config;

  try {
    const [providersRes, typesRes] = await Promise.all([
      fetch(providersURL),
      fetch(typesURL)
    ]);

    if (!providersRes.ok) throw new Error("providers.json not found");
    if (!typesRes.ok) throw new Error("types.json not found");

    const providersData = await providersRes.json();
    const typesData = await typesRes.json();

    config = {
      providers: providersData.providers || providersData,
      record_types: typesData.record_types || typesData
    };

  } catch (err) {
    showError(err.message);
    return;
  }

  providerInput.innerHTML = "";
  config.providers.forEach(function (provider, index) {
    const option = document.createElement("option");
    option.value = provider.id;
    option.textContent = provider.name;
    if (index === 0) option.selected = true;
    providerInput.appendChild(option);
  });

  typeInput.innerHTML = "";
  config.record_types.forEach(function (record, index) {
    const option = document.createElement("option");
    option.value = record.value;
    option.textContent = record.name + " — " + record.description;
    if (index === 0) option.selected = true;
    typeInput.appendChild(option);
  });

  tipsContainer.innerHTML = "";
  config.record_types.forEach(function (record) {
    const li = document.createElement("li");
    li.innerHTML = "<code>" + record.value + "</code> — " + record.description;
    tipsContainer.appendChild(li);
  });

  async function executeQuery() {
    const domain = domainInput.value.trim();
    const type = typeInput.value;
    const selectedProviderId = providerInput.value;
    const selectedProvider = config.providers.find(function (provider) {
      return provider.id === selectedProviderId;
    });

    if (!domain) { showError("Please enter a domain name"); return; }
    if (!selectedProvider) { showError("DNS provider not found"); return; }

    errorContainer.style.display = "none";
    outputContainer.style.display = "none";

    queryButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Querying...';
    queryButton.disabled = true;

    try {
      const url = selectedProvider.url +
        "?name=" + encodeURIComponent(domain) +
        "&type=" + encodeURIComponent(type);

      const response = await fetch(url, {
        headers: { "Accept": "application/dns-json" }
      });

      if (!response.ok) throw new Error("HTTP error! status: " + response.status);

      const data = await response.json();

      let result = "";
      result += "🔍 DNS Query Results\n";
      result += "══════════════════════════\n";
      result += "Provider: " + selectedProvider.name + "\n";
      result += "Domain: " + domain + "\n";
      result += "Type: " + type + "\n";
      result += "──────────────────────────\n\n";

      if (data.Status !== 0) {
        result += "❌ DNS Error: Status " + data.Status;
      } else if (!data.Answer || data.Answer.length === 0) {
        result += "❌ No DNS records found for this query.";
      } else {
        data.Answer.forEach(function (record, index) {
          result += "Record #" + (index + 1) + "\n";
          result += "Name: " + record.name + "\n";
          result += "Type: " + record.type + "\n";
          result += "TTL: " + record.TTL + " seconds\n";
          result += "Data: " + record.data + "\n";
          if (index < data.Answer.length - 1) {
            result += "──────────────────────────\n";
          }
        });
      }

      result += "\n\nQuery completed at " + new Date().toLocaleTimeString();

      outputContainer.textContent = result;
      outputContainer.style.display = "block";

    } catch (err) {
      showError("Error: " + err.message);
    } finally {
      queryButton.innerHTML = '<i class="fas fa-search"></i> Query DNS';
      queryButton.disabled = false;
    }
  }

  function showError(message) {
    errorContainer.innerHTML =
      '<i class="fas fa-exclamation-circle"></i> ' + message;
    errorContainer.style.display = "block";
  }

  queryButton.addEventListener("click", executeQuery);

  domainInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter") executeQuery();
  });

  typeInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter") executeQuery();
  });

})();
