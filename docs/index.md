# Crypto Tools & Guides

Praktische, dagelijks gegenereerde crypto‑guides met tools en veilige stappen. Monetisatie via affiliate‑aanbevelingen en later advertenties.

<div class="cta">
  Start hier: <a data-aff="ledger" href="{{ site.data.affiliates.ledger }}">Ledger</a> · <a data-aff="trezor" href="{{ site.data.affiliates.trezor }}">Trezor</a> · <a data-aff="koinly" href="{{ site.data.affiliates.koinly }}">Koinly</a>{% if site.data.affiliates.bybit contains 'bybit' %} · <a data-aff="bybit" href="{{ site.data.affiliates.bybit }}">Bybit</a>{% endif %}
</div>

## Latest posts

{% assign pages_list = site.pages | where_exp: "p", "p.path contains 'posts/'" %}
{% assign sorted = pages_list | sort: 'date' | reverse %}
{% if sorted.size > 0 %}
<div class="grid">
{% for p in sorted limit:12 %}
  <div class="card">
    <h3><a href="{{ site.baseurl }}{{ p.url }}">{{ p.title }}</a></h3>
    <div class="meta">{{ p.date | date: "%Y-%m-%d" }}<span class="badge">{{ p.category | default: 'Guide' }}</span></div>
    <p class="meta">Short, practical how‑to for beginners.</p>
  </div>
{% endfor %}
</div>
{% else %}
<p>- Coming soon... (auto-publishing enabled)</p>
{% endif %}

<div class="cta">
  Prefer a hardware wallet? Start with Ledger or Trezor:
  <br />
  <a href="{{ site.data.affiliates.ledger }}">Ledger</a> · <a href="{{ site.data.affiliates.trezor }}">Trezor</a> · <a href="{{ site.data.affiliates.koinly }}">Koinly</a>
</div>
