export function downloadJSON(name: string, data: any) {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `${name}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  URL.revokeObjectURL(url);
}

export function uploadJSON(k: (data: JSON) => any) {
  const input: HTMLInputElement = document.createElement("input");
  input.type = "file";
  input.accept = ".json";

  input.onchange = (event) => {
    if (event.target === null) {
      console.error("User cancelled the dialog");
      return;
    }

    // @ts-ignore
    const file: File = event.target.files[0];

    if (!file) {
      console.error("User cancelled the dialog");
      return;
    }

    if (file.type !== "application/json") {
      console.error("Please select a valid JSON file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target === null) {
        console.error("File reader error");
        return;
      }

      const content = event.target.result;

      if (!(typeof content === "string")) {
        console.error("Invalid JSON content");
        return;
      }

      const data = JSON.parse(content);
      k(data);
    };
    reader.onerror = (event) => {
      console.error(`File reader error: ${event.target?.error?.message}`);
    };
  };

  input.click();
}
