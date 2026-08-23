const {
  buildCorsHeaders,
  publishSubmission
} = require("../../server/publish-submission");

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      ...buildCorsHeaders()
    },
    body: JSON.stringify(body)
  };
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers: buildCorsHeaders(),
      body: ""
    };
  }

  if (event.httpMethod !== "POST") {
    return json(405, { error: "Method not allowed." });
  }

  try {
    const payload = JSON.parse(event.body || "{}");
    return json(200, await publishSubmission(payload));
  } catch (error) {
    return json(error.statusCode || 500, {
      error: error.message || "Could not publish right now."
    });
  }
};
