import re, json, sys, html
src, out = sys.argv[1], sys.argv[2]
s = open(src, encoding='utf-8').read()
def cd(tag, t):
    m = re.search(r'<%s>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?</%s>' % (tag, tag), t, re.S)
    return m.group(1) if m else ''
items = []
for it in s.split('<item>')[1:]:
    it = it.split('</item>')[0]
    meta = {}
    for k, v in re.findall(r'<wp:postmeta>\s*<wp:meta_key><!\[CDATA\[(.*?)\]\]></wp:meta_key>\s*<wp:meta_value><!\[CDATA\[(.*?)\]\]></wp:meta_value>', it, re.S):
        if k.startswith('_') and not k.startswith(('_yoast', '_thumbnail', '_wp_attached_file', '_wp_page_template', '_menu_item')):
            continue
        meta[k] = v
    terms = [{'domain': d, 'slug': sl, 'name': html.unescape(n)} for d, sl, n in re.findall(r'<category domain="(.*?)" nicename="(.*?)"><!\[CDATA\[(.*?)\]\]></category>', it)]
    items.append({
        'id': int(cd('wp:post_id', it)), 'type': cd('wp:post_type', it), 'status': cd('wp:status', it),
        'title': html.unescape(cd('title', it)), 'slug': cd('wp:post_name', it), 'link': cd('link', it),
        'date': cd('wp:post_date', it), 'modified': cd('wp:post_modified', it), 'parent': int(cd('wp:post_parent', it) or 0),
        'menu_order': int(cd('wp:menu_order', it) or 0), 'content': cd('content:encoded', it), 'excerpt': cd('excerpt:encoded', it),
        'attachment_url': cd('wp:attachment_url', it), 'terms': terms, 'meta': meta,
    })
skip = {'acf-field', 'acf-field-group', 'wp_font_face', 'wp_font_family', 'wp_global_styles', 'adelf_lead', 'adelf_subscriber'}
data = {'items': [i for i in items if i['type'] not in skip]}
data['terms'] = [{'taxonomy': t, 'slug': sl, 'name': html.unescape(n), 'description': html.unescape(d)} for t, sl, n, d in re.findall(r'<wp:term>.*?<wp:term_taxonomy><!\[CDATA\[(.*?)\]\]></wp:term_taxonomy>\s*<wp:term_slug><!\[CDATA\[(.*?)\]\]></wp:term_slug>.*?<wp:term_name><!\[CDATA\[(.*?)\]\]></wp:term_name>(?:\s*<wp:term_description><!\[CDATA\[(.*?)\]\]></wp:term_description>)?', s, re.S)]
json.dump(data, open(out, 'w'), ensure_ascii=False, indent=1)
import collections
print(collections.Counter(i['type'] for i in data['items']), len(data['terms']))
