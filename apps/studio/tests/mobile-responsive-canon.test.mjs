import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')
const css = fs.readFileSync(path.join(root, 'app/globals.css'), 'utf8')
const shell = fs.readFileSync(path.join(root, 'components/studio/StudioShell.tsx'), 'utf8')

assert.match(shell, /className="nav studio-rail-v2"/)
assert.match(shell, /className="rail-group-v2"/)

const mobile = css.slice(css.indexOf('@media (max-width: 920px)'), css.indexOf('@media (max-width: 720px)'))
assert.ok(mobile.length > 0, 'Studio 920px mobile breakpoint must exist')
assert.match(mobile, /\.studio-rail-v2\s*\{[\s\S]*display:\s*grid/)
assert.match(mobile, /\.studio-rail-v2 \.rail-group-v2\s*\{[\s\S]*display:\s*flex/)
assert.match(mobile, /overflow-x:\s*auto/)
assert.match(mobile, /min-height:\s*44px/)
assert.match(mobile, /white-space:\s*nowrap/)

const narrow = css.slice(css.indexOf('@media (max-width: 640px)'))
assert.ok(narrow.length > 0, 'Studio 640px mobile breakpoint must exist')
assert.match(narrow, /font-size:\s*clamp\(2\.15rem,\s*10\.5vw,\s*3\.2rem\)/)
assert.match(narrow, /\\.studio-rail-v2 \\.rail-group-v2\\s*\\{[\\s\\S]*flex-wrap:\\s*wrap/)
assert.match(narrow, /overflow-x:\\s*visible/)
assert.match(narrow, /\\.studio-rail-v2 \\.rail-group-v2 p\\s*\\{[\\s\\S]*flex-basis:\\s*100%/)
assert.doesNotMatch(narrow, /15vw/)

console.log('mobile-responsive-canon: ok')
