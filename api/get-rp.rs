use chrono::{Duration, Utc};
use reqwest::header::{AUTHORIZATION, CONTENT_TYPE};
use serde::{Deserialize, Serialize};
use vercel_runtime::{run, Body, Error, Request, Response, StatusCode};

#[derive(Debug, Deserialize, Serialize)]
struct PlayerRp {
    id: i32,
    rp: i32,
    created_at: String,
}

async fn handler(_req: Request) -> Result<Response<Body>, Error> {
    let supabase_url = std::env::var("SUPABASE_URL")?;
    let service_key = std::env::var("SUPABASE_SERVICE_ROLE_KEY")?;

    let since = (Utc::now() - Duration::days(30)).to_rfc3339();
    let endpoint = format!(
        "{}/rest/v1/player_rp?select=id,rp,created_at&created_at=gte.{}&order=created_at.asc",
        supabase_url, since
    );

    let client = reqwest::Client::new();
    let response = client
        .get(endpoint)
        .header("apikey", &service_key)
        .header(AUTHORIZATION, format!("Bearer {}", service_key))
        .header(CONTENT_TYPE, "application/json")
        .send()
        .await?;

    let status = response.status();
    let body = response.text().await?;

    if !status.is_success() {
        let error_message = format!("Supabase request failed: {}", body);
        return Ok(Response::builder()
            .status(StatusCode::INTERNAL_SERVER_ERROR)
            .header("content-type", "application/json")
            .body(Body::Text(
                serde_json::json!({ "error": error_message }).to_string(),
            ))?);
    }

    let parsed: Vec<PlayerRp> = serde_json::from_str(&body)?;
    Ok(Response::builder()
        .status(StatusCode::OK)
        .header("content-type", "application/json")
        .body(Body::Text(serde_json::to_string(&parsed)?))?)
}

#[tokio::main]
async fn main() -> Result<(), Error> {
    run(handler).await
}
