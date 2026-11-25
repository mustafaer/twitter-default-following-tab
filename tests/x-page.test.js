'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');

const xPage = require('../src/lib/x-page.js');

function page(html) {
  return new JSDOM(`<!doctype html><body>${html}</body>`).window.document;
}

const SVG = '<svg xmlns="http://www.w3.org/2000/svg"></svg>';

/** The home header as recorded on x.com, including the empty composer toolbar tablist. */
const HOME = `
  <div data-testid="primaryColumn">
    <div data-testid="toolBar"><div role="tablist"></div></div>
    <nav role="navigation"><div role="tablist" data-testid="ScrollSnap-List">
      <div role="presentation"><div role="tab" aria-selected="false"><span>For you</span></div></div>
      <div role="presentation"><div role="tab" aria-selected="true" aria-haspopup="menu" aria-expanded="false"><span>Following</span></div></div>
      <div role="presentation"><div role="tab" aria-selected="false"><span>Build   in Public</span></div></div>
    </div></nav>
  </div>`;

test('recognises the home page paths', () => {
  for (const path of ['/', '/home', '/home/', '']) {
    assert.equal(xPage.isHomePath(path), true, path);
  }
  for (const path of ['/explore', '/homes', '/home/extra', '/mustafaer', '/i/lists/1']) {
    assert.equal(xPage.isHomePath(path), false, path);
  }
});

test('finds the home tabs, skipping empty tablists', () => {
  const doc = page(HOME);
  const tabs = xPage.getHomeTabs(doc);
  assert.deepEqual(tabs.map(xPage.getLabel), ['For you', 'Following', 'Build in Public']);
  assert.equal(xPage.isSelected(tabs[1]), true);
  assert.equal(xPage.hasSortMenu(tabs[1]), true);
  assert.equal(xPage.hasSortMenu(tabs[0]), false);
  assert.equal(xPage.isMenuExpanded(tabs[1]), false);
});

test('ignores tablists outside the primary column', () => {
  const doc = page('<div role="tablist"><div role="tab">A</div><div role="tab">B</div></div>');
  assert.deepEqual(xPage.getHomeTabs(doc), []);
});

test('spots posts that were not on screen before', () => {
  const doc = page('<div data-testid="primaryColumn"><section><article data-testid="tweet"></article></section></div>');
  const before = xPage.snapshotTweets(doc);
  assert.equal(xPage.hasFreshTweets(doc, before), false);
  const fresh = doc.createElement('article');
  fresh.setAttribute('data-testid', 'tweet');
  doc.querySelector('section').append(fresh);
  assert.equal(xPage.hasFreshTweets(doc, before), true);
});

test('finds a menu that opened after the snapshot', () => {
  const doc = page('<div id="layers"><div role="menu" id="old"></div></div>');
  const before = xPage.snapshotMenus(doc);
  assert.equal(xPage.findNewMenu(doc, before), null);
  const menu = doc.createElement('div');
  menu.setAttribute('role', 'menu');
  doc.getElementById('layers').append(menu);
  assert.equal(xPage.findNewMenu(doc, before), menu);
});

test('picks sort items by English label, else by position', () => {
  const english = page(`<div role="menu"><span>Sort by</span>
    <div role="menuitem"><span>Popular</span></div>
    <div role="menuitem"><span>Recent</span>${SVG}</div></div>`).querySelector('[role="menu"]');
  assert.equal(xPage.getLabel(xPage.findSortItem(english, 'recent')), 'Recent');
  assert.equal(xPage.getLabel(xPage.findSortItem(english, 'popular')), 'Popular');

  const reordered = page(`<div role="menu">
    <div role="menuitem"><span>Recent</span></div>
    <div role="menuitem"><span>Popular</span></div></div>`).querySelector('[role="menu"]');
  assert.equal(xPage.getLabel(xPage.findSortItem(reordered, 'recent')), 'Recent', 'labels win over position');

  const turkish = page(`<div role="menu">
    <div role="menuitem"><span>Popüler</span></div>
    <div role="menuitem"><span>En son</span></div></div>`).querySelector('[role="menu"]');
  assert.equal(xPage.getLabel(xPage.findSortItem(turkish, 'popular')), 'Popüler');
  assert.equal(xPage.getLabel(xPage.findSortItem(turkish, 'recent')), 'En son');

  const unknown = page(`<div role="menu">
    <div role="menuitem">A</div><div role="menuitem">B</div><div role="menuitem">C</div></div>`).querySelector(
    '[role="menu"]',
  );
  assert.equal(xPage.findSortItem(unknown, 'recent'), null, 'never guesses on an unfamiliar menu');
});

test('reads which sort item is checked', () => {
  const menu = page(`<div role="menu">
    <div role="menuitem" id="popular">Popular</div>
    <div role="menuitem" id="recent">Recent${SVG}</div></div>`).querySelector('[role="menu"]');
  const doc = menu.ownerDocument;
  assert.equal(xPage.isMenuItemChecked(doc.getElementById('recent'), menu), true);
  assert.equal(xPage.isMenuItemChecked(doc.getElementById('popular'), menu), false);

  const allIcons = page(`<div role="menu">
    <div role="menuitem" id="a">A${SVG}</div><div role="menuitem" id="b">B${SVG}</div></div>`).querySelector(
    '[role="menu"]',
  );
  assert.equal(
    xPage.isMenuItemChecked(allIcons.ownerDocument.getElementById('a'), allIcons),
    false,
    'icons on every item say nothing about the choice',
  );

  const aria = page(`<div role="menu">
    <div role="menuitem" aria-checked="true" id="a">A</div><div role="menuitem" aria-checked="false" id="b">B${SVG}</div></div>`).querySelector(
    '[role="menu"]',
  );
  assert.equal(xPage.isMenuItemChecked(aria.ownerDocument.getElementById('a'), aria), true, 'aria-checked wins');
  assert.equal(xPage.isMenuItemChecked(aria.ownerDocument.getElementById('b'), aria), false);
});
