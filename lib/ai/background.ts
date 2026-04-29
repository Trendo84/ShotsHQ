/** birefnet matte extraction via fal.ai. */

const FAL_KEY = process.env.FAL_KEY ?? "";

export async function birefnetMatte(imageUrl: string): Promise<string> {
  const res = await fetch("https://fal.run/fal-ai/birefnet", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Key ${FAL_KEY}`,
    },
    body: JSON.stringify({ image_url: imageUrl }),
  });
  if (!res.ok) throw new Error(`birefnet failed: ${res.status}`);
  const json = (await res.json()) as { image: { url: string } };
  return json.image.url;
}
