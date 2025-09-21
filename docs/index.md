# Crypto Tools & Guides

Daily auto-generated guides about wallets, DEXs, security and tax tools.

- Fresh posts every day
- Neutral, beginner-friendly
- Includes affiliate links (you support the site at no extra cost)

## Latest posts

{% assign pages_list = site.pages | where_exp: "p", "p.path contains 'posts/'" %}
{% assign sorted = pages_list | sort: 'date' | reverse %}
{% if sorted.size > 0 %}
{% for p in sorted limit:20 %}
- [{{ p.title | default: p.url }}]({{ p.url }})
{% endfor %}
{% else %}
- Coming soon... (auto-publishing enabled)
{% endif %}
