const {
  buildCorsHeaders,
  publishSubmission
} = require("../server/publish-submission");

module.exports = async function handler(request, response) {
  const corsHeaders = buildCorsHeaders();
  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.setHeader(key, value);
  });

  if (request.method === "OPTIONS") {
    response.status(204).end();
    return;
  }

  if (request.method !== "POST") {
    response.status(405).json({ error: "Method not allowed." });
    return;
  }

  try {
    const result = await publishSubmission(request.body || {});
    response.status(200).json(result);
  } catch (error) {
    response.status(error.statusCode || 500).json({
      error: error.message || "Could not publish right now."
    });
  }
};
