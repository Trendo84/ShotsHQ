/**
 * fal.ai Flux 2 invocations. We hit the REST endpoint directly to avoid
 * pulling another SDK into the bundle — fal.ai's signed urls are simple.
 */

const FAL_KEY = process.env.FAL_KEY ?? "";

type FluxResult = {
  images: Array<{ url: string; width: number; height: number }>;
};

export async function falFlux(input: {
  prompt: string;
  imageUrl?: string;
  width: number;
  height: number;
}): Promise<FluxResult> {
  const endpoint = "https://fal.run/fal-ai/flux/schnell";
  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Key ${FAL_KEY}`,
    },
    body: JSON.stringify({
      prompt:        input.prompt,
      image_url:     input.imageUrl,
      image_size:    { width: input.width, height: input.height },
      num_inference_steps: 4,
      enable_safety_checker: true,
    }),
  });

  if (!res.ok) throw new Error(`fal.ai flux failed: ${res.status} ${await res.text()}`);
  return (await res.json()) as FluxResult;
}
