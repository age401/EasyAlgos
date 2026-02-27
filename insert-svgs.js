var fs = require('fs');

var html = fs.readFileSync('d:\\work-local\\kystopia\\easyalgos\\index.html', 'utf8');

var svg3 = fs.readFileSync('d:\\work-local\\kystopia\\easyalgos\\img\\hiw-rocks-03.processed.svg', 'utf8');
var svg4 = fs.readFileSync('d:\\work-local\\kystopia\\easyalgos\\img\\hiw-rocks-04.processed.svg', 'utf8');

function indent(svgContent, spaces) {
  return svgContent.split('\n').filter(function(l) { return l.trim(); }).map(function(line) {
    return ' '.repeat(spaces) + line;
  }).join('\n');
}

// Card 2 (data-hiw-card="2") - insert rocks with cr3 SVG
var card2Anchor = '<div class="hiw__card-inner" style="background: linear-gradient(63.43deg, #3F64BF 0%, #4B76E3 100%)">\n          <div class="hiw__left">';
var card2Replace = '<div class="hiw__card-inner" style="background: linear-gradient(63.43deg, #3F64BF 0%, #4B76E3 100%)">\n          <div class="hiw__rocks" data-rocks="3">\n' + indent(svg3, 12) + '\n          </div>\n          <div class="hiw__left">';

html = html.replace(card2Anchor, card2Replace);

// Card 3 (data-hiw-card="3") - insert rocks with cr4 SVG
var card3Anchor = '<div class="hiw__card-inner" style="background: linear-gradient(-49.4deg, #205EFB 8.37%, #B36DFF 72.78%)">\n          <div class="hiw__left">';
var card3Replace = '<div class="hiw__card-inner" style="background: linear-gradient(-49.4deg, #205EFB 8.37%, #B36DFF 72.78%)">\n          <div class="hiw__rocks" data-rocks="4">\n' + indent(svg4, 12) + '\n          </div>\n          <div class="hiw__left">';

html = html.replace(card3Anchor, card3Replace);

fs.writeFileSync('d:\\work-local\\kystopia\\easyalgos\\index.html', html, 'utf8');
console.log('SVGs inserted into index.html');
