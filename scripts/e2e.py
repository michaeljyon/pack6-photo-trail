import json, sys, os, base64, urllib.request
from playwright.sync_api import sync_playwright, expect
BASE='http://localhost:5199'; SP=sys.argv[1]; DEMO='scripts/demo'
errors=[]
def api(path, body=None, code='pack6', leader=None):
    h={'content-type':'application/json','x-pack-code':code}
    if leader: h['x-leader-passcode']=leader
    r=urllib.request.Request(BASE+'/api/'+path, data=json.dumps(body).encode() if body is not None else None, headers=h, method='POST' if body is not None else 'GET')
    return json.loads(urllib.request.urlopen(r).read())
with sync_playwright() as p:
    b=p.chromium.launch()
    ctx=b.new_context(viewport={'width':390,'height':844}, device_scale_factor=2, is_mobile=True, has_touch=True)
    pg=ctx.new_page(); pg.on('pageerror', lambda e: errors.append(str(e))); pg.on('console', lambda m: m.type=='error' and errors.append(m.text))
    pg.goto(BASE); pg.wait_for_timeout(800); pg.screenshot(path=f'{SP}/01-gate.png')
    pg.fill('input', 'wrong'); pg.click('text=Open the trail'); expect(pg.locator('.form-msg')).to_be_visible()
    pg.fill('input', 'Pack6'); pg.click('text=Open the trail'); pg.wait_for_selector('.hero'); pg.wait_for_timeout(500)
    pg.screenshot(path=f'{SP}/02-home-empty.png')
    # permission form via UI
    pg.click('.perm-card'); pg.wait_for_selector('text=The three choices')
    pg.fill('.scout >> nth=0 >> input >> nth=0', 'Ava'); pg.fill('.scout >> nth=0 >> .initial input', 'r')
    pg.select_option('.scout >> nth=0 >> select', 'Wolves'); pg.click('.scout >> nth=0 >> .lvl-opt.lvl-public')
    pg.click('text=Add another scout')
    pg.fill('.scout >> nth=1 >> input >> nth=0', 'Leo'); pg.fill('.scout >> nth=1 >> .initial input', 'R')
    pg.select_option('.scout >> nth=1 >> select', 'Lions'); pg.click('.scout >> nth=1 >> .lvl-opt.lvl-pack')
    pg.screenshot(path=f'{SP}/03-permission-form.png', full_page=True)
    pg.fill('input[autocomplete=name] >> nth=0', 'Dana Rivera'); pg.fill('input[type=email]', 'dana@example.com')
    pg.fill('.sig', 'Dana Rivera'); pg.check('form .check input'); pg.click('text=Save my choices'); pg.wait_for_timeout(800)
    if pg.locator('.form-msg').count(): print('MSG', pg.locator('.form-msg').inner_text()); pg.screenshot(path=f'{SP}/dbg.png', full_page=True)
    pg.wait_for_selector('text=On file for your family'); pg.wait_for_timeout(300); pg.screenshot(path=f'{SP}/04-permission-onfile.png')
    # more families via API
    api('consent', {'parent':{'name':'Chris Tran'}, 'scouts':[{'first':'Mia','lastInitial':'T','den':'Wolves','level':'none'}], 'signature':'Chris Tran', 'agreed':True})
    api('consent', {'parent':{'name':'Jo Kim'}, 'scouts':[{'first':'Sam','lastInitial':'K','den':'Bears','level':'public'},{'first':'Nora','lastInitial':'K','den':'Tigers','level':'public'}], 'signature':'Jo Kim', 'agreed':True})
    roster={s['name']:s['id'] for s in api('roster')['scouts']}
    print('roster', roster)
    # snap via UI
    pg.goto(BASE+'/#/snap'); pg.wait_for_selector('text=First, a quick setup'); pg.wait_for_timeout(400)
    pg.fill('.setup input', 'Dana Rivera'); pg.check('.setup .check input')
    pg.click('.chip.big:has-text("Campouts")'); pg.select_option('label.field:has-text("Den") select', 'Wolves')
    pg.click('.mission:has-text("Best campfire moment")')
    pg.wait_for_selector('.tag-chips'); pg.click('.tag-chips .chip:has-text("Ava R.")')
    pg.screenshot(path=f'{SP}/05-snap.png', full_page=True)
    pg.set_input_files('input[type=file][multiple]', [f'{DEMO}/campfire.jpg', f'{DEMO}/tents.jpg'])
    pg.wait_for_selector('.form-msg.good', timeout=20000); pg.wait_for_timeout(400)
    pg.screenshot(path=f'{SP}/06-snap-sent.png', full_page=True)
    # more uploads via API
    def up(f, album, den, tags, cap):
        img='data:image/jpeg;base64,'+base64.b64encode(open(f'{DEMO}/{f}','rb').read()).decode()
        return api('photos', {'image':img,'thumb':img,'name':'Pat Leader','role':'leader','album':album,'den':den,'scouts':[roster[t] for t in tags],'caption':cap,'release':True})
    up('derby.jpg','derby','Bears',['Sam K.'],'Race day!')
    up('rocket.jpg','den','Wolves',['Mia T.','Ava R.'],'Rocket launch')
    up('lake.jpg','campout','',[],'Sunset paddle')
    up('trail.jpg','den','Tigers',['Nora K.'],'Nature find')
    # leader tools
    pg.goto(BASE+'/#/leaders'); pg.fill('input[type=password]', 'leader'); pg.click('text=Open leader tools')
    pg.wait_for_selector('.review-list'); pg.wait_for_timeout(600); pg.screenshot(path=f'{SP}/07-leader-review.png', full_page=True)
    # approve all but blocked
    for _ in range(6):
        btns=pg.locator('.review:not(:has(.flag.bad)) button:has-text("Approve")')
        if btns.count()==0: break
        btns.first.click(); pg.wait_for_timeout(400)
    blocked=pg.locator('.review:has(.flag.bad) button:has-text("Hide")')
    if blocked.count(): blocked.first.click(); pg.wait_for_timeout(400)
    pg.click('.chip:has-text("In gallery")'); pg.wait_for_timeout(300)
    pub=pg.locator('.review:has(.flag.good) button:has-text("OK for public")')
    print('public-able', pub.count()); pub.first.click(); pg.wait_for_timeout(400)
    pg.screenshot(path=f'{SP}/08-leader-approved.png', full_page=True)
    pg.click('.tabs button:has-text("Permissions")'); pg.wait_for_selector('.fam-list'); pg.screenshot(path=f'{SP}/09-leader-roster.png', full_page=True)
    pg.click('.tabs button:has-text("Albums")'); pg.fill('input[placeholder^="e.g."]', 'Fall Campout 2026'); pg.click('.emoji-pick button:has-text("🎃")'); pg.click('text=Add album'); pg.wait_for_selector('text=Fall Campout 2026')
    # family views
    pg.goto(BASE+'/#/'); pg.wait_for_timeout(1200); pg.screenshot(path=f'{SP}/10-home-full.png', full_page=True)
    pg.goto(BASE+'/#/gallery'); pg.wait_for_selector('.gallery img'); pg.wait_for_timeout(800); pg.screenshot(path=f'{SP}/11-gallery.png')
    pg.click('.gallery button >> nth=0'); pg.wait_for_selector('.lightbox img'); pg.wait_for_timeout(600); pg.screenshot(path=f'{SP}/12-lightbox.png')
    n=pg.locator('.gallery li').count(); print('gallery count', n)
    pg.goto(BASE+'/#/snap'); pg.wait_for_timeout(1200); print('mine statuses', pg.locator('.mine .status').all_inner_texts())
    # slideshow on a wide screen
    d=b.new_context(viewport={'width':1280,'height':720}, storage_state=ctx.storage_state()); sp=d.new_page(); sp.on('pageerror', lambda e: errors.append(str(e)))
    sp.goto(BASE+'/#/slideshow'); sp.wait_for_selector('.show-img'); sp.wait_for_timeout(1500); sp.screenshot(path=f'{SP}/13-slideshow.png')
    sp.wait_for_timeout(4500); sp.screenshot(path=f'{SP}/14-slideshow-calm.png')
    # leader views on desktop
    lp=d.new_page(); lp.goto(BASE+'/#/leaders'); lp.fill('input[type=password]', 'leader'); lp.click('text=Open leader tools'); lp.wait_for_selector('.review-list, .empty'); lp.click('.chip:has-text("All")'); lp.wait_for_timeout(700); lp.screenshot(path=f'{SP}/15-leader-desktop.png', full_page=True)
    b.close()
print('csv permissions:\n', urllib.request.urlopen(urllib.request.Request(BASE+'/api/leader/export/permissions', headers={'x-leader-passcode':'leader'})).read().decode())
print('csv photos:\n', urllib.request.urlopen(urllib.request.Request(BASE+'/api/leader/export/photos', headers={'x-leader-passcode':'leader'})).read().decode()[:900])
print('public list keys:', api('photos')['photos'][0].keys())
print('ERRORS', errors)
