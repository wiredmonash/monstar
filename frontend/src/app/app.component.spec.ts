import { maskProfileUrl } from './app.component';

describe('maskProfileUrl', () => {
  it('replaces the username in profile page URLs', () => {
    expect(
      maskProfileUrl({
        type: 'pageview',
        url: 'https://monstar.wired.org.au/user/abcd1234?tab=reviews#top',
      })
    ).toEqual({
      type: 'pageview',
      url: 'https://monstar.wired.org.au/user/[username]?tab=reviews#top',
    });
  });

  it('leaves other pages alone', () => {
    const event = {
      type: 'pageview' as const,
      url: 'https://monstar.wired.org.au/unit/fit1008',
    };

    expect(maskProfileUrl(event)).toEqual(event);
  });
});
