import { speakText } from './speechUtils';

describe('CVC balloon speech', () => {
  beforeEach(() => {
    const speak = jest.fn();
    const cancel = jest.fn();

    Object.defineProperty(window, 'speechSynthesis', {
      configurable: true,
      value: { speak, cancel },
    });

    global.SpeechSynthesisUtterance = function SpeechSynthesisUtterance(text) {
      this.text = text;
      this.rate = 1;
    };
  });

  it('speaks the clicked balloon letter and the finished word', () => {
    speakText('M');
    speakText('MEN');

    expect(window.speechSynthesis.speak).toHaveBeenCalledTimes(2);
    expect(window.speechSynthesis.speak.mock.calls[0][0].text).toBe('M');
    expect(window.speechSynthesis.speak.mock.calls[1][0].text).toBe('MEN');
  });
});
