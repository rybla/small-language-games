import { stringify } from "@/utility";
import { Element } from "./ontology";

export function foldElement<A>(
  f: (element: Element) => A[],
  element: Element,
): A[] {
  const xs: A[] = [];
  walkElement((e) => xs.push(...f(e)), element);
  return xs;
}

export function walkElement(f: (element: Element) => void, element: Element) {
  switch (element.type) {
    case "text": {
      f(element);
      break;
    }
    case "button": {
      f(element);
      break;
    }
    case "group": {
      f(element);
      const kids = [...element.kids];
      kids.forEach((kid) => walkElement(f, kid));
      break;
    }
    case "image": {
      f(element);
      break;
    }
    case "variable": {
      f(element);
      break;
    }
    case "placeholder": {
      f(element);
      break;
    }
    default: {
      element satisfies never;
    }
  }
}

// export function presentElement(element: Element): string {
//   switch (element.type) {
//     case "button":
//       return `
// button: ${element.purpose}
//   - label: ${element.label}
//   - click: ${element.clickEffect}
// `.trim();
//     case "group":
//       return `
// group: ${element.purpose}
//   - layout: ${element.layout}
//   - scrollable: ${element.scrollable}
// `.trim();
//     case "image":
//       return `
// image: ${element.purpose}
//   - slug: ${element.slug}
//   - aspectRatio: ${element.aspectRatio}
//   - description: ${element.description}
// `.trim();
//     case "placeholder":
//       return `
// placeholder: ${element.purpose}
// `.trim();
//     case "text":
//       return `
// text: ${element.purpose}
// `.trim();
//     case "variable":
//       return `
// button: ${element.purpose}
// `.trim();
//     case "button":
//       return `
// button: ${element.purpose}
// `.trim();
//     case "button":
//       return `
// button: ${element.purpose}
// `.trim();
//   }
// }

export function presentElement(element: Element): string {
  return stringify(element);
}
