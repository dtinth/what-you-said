export function postprocessText(text: string) {
  text = text.replace(/fire best/gi, "Firebase");
  text = text.replace(/fire base/gi, "Firebase");

  return text;
}
