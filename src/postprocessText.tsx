export function postprocessText(text: string) {
  text = text.replace(/fire best/gi, "Firebase");
  text = text.replace(/fire base/gi, "Firebase");
  text = text.replace(/doctor image/gi, "Docker image");
  text = text.replace(/GitHub actions/gi, "GitHub Actions");

  return text;
}
