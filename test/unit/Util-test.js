/*global describe it expect*/
'use strict';

import Util from '../../src/Util';

describe('IsEmpty', () => {
  it('should return true on undefined input', () => expect(Util.isEmpty()).to.equal(true));
  it('should return true on null input', () => expect(Util.isEmpty(null)).to.equal(true));
  it('should return true on empty string input', () => expect(Util.isEmpty('')).to.equal(true));
  it('should return false on whitespace string input', () => expect(Util.isEmpty('  ')).to.equal(false));
  it('should return false on some string input', () => expect(Util.isEmpty('some string')).to.equal(false));
});