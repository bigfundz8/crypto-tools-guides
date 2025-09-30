{% include header.html %}

<div class="hero">
<h1>Crypto Tools & Guides</h1>
<p>Praktische, dagelijks gegenereerde crypto‑guides met veilige stappen en duidelijke tools. Monetisatie via affiliate‑aanbevelingen en later advertenties.</p>
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
    {% if p.summary %}
    <p>{{ p.summary }}</p>
    {% else %}
    <p class="meta">Short, practical how‑to for beginners.</p>
    {% endif %}
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
