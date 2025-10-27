"""
Perplexity API client for fetching real news and competitive intelligence.
"""
import os
import json
import requests
from typing import Optional


class PerplexityClient:
    """Client for interacting with Perplexity API."""

    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize Perplexity client.

        Args:
            api_key: Perplexity API key. If None, uses PPLX_API_KEY environment variable.
        """
        self.api_key = api_key or os.getenv("PPLX_API_KEY")

        print(self.api_key);

        self.base_url = "https://api.perplexity.ai/chat/completions"
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

    def get_company_news(
        self,
        company_name: str,
        competitors: list[str] = None,
        num_news: int = 5,
        model: str = "sonar"
    ) -> list[dict]:
        """
        Fetch relevant news for a company using Perplexity AI.

        Args:
            company_name: Name of the company to analyze
            competitors: List of competitor names (optional)
            num_news: Number of news items to fetch
            model: Perplexity model to use (default: "sonar")

        Returns:
            List of news items with title, source, link, impact, and explanation

        Raises:
            ValueError: If API key is not configured
            ConnectionError: If API request fails
        """
        if not self.api_key:
            raise ValueError("PPLX_API_KEY not configured. Set environment variable or pass api_key parameter.")

        # Build competitor list string
        competitor_str = ', '.join(competitors) if competitors else 'competitors in the industry'

        # Create prompt for Perplexity
        prompt = f"""
        Act as a strategic intelligence analyst.
        Find the {num_news} most relevant and recent news items from today
        that could affect {company_name} as a company,
        excluding news directly about the company, focusing on:

        - Activities of competitors ({competitor_str})
        - Regulations and policies in the sector
        - Market trends affecting product adoption
        - Technological or ethical risks in the industry

        **Return ONLY as JSON**, without markdown, without ```json, without explanation, just the array.
        It is essential that each item has a url.
        Expected format:
        [
            {{
                "title": "Headline",
                "source": "Source and date",
                "link": "URL",
                "impact": "High threat | Moderate risk | Opportunity",
                "impact_explanation": "Brief explanation of the impact"
            }},
            ...
        ]
        """

        # Prepare request payload
        data = {
            "model": model,
            "messages": [
                {
                    "role": "system",
                    "content": "You are an expert analyst in business intelligence and media."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        }

        try:
            # Make API request
            response = requests.post(
                self.base_url,
                headers=self.headers,
                json=data,
                timeout=30
            )

            if response.status_code == 200:
                content = response.json()["choices"][0]["message"]["content"]

                # Parse JSON response
                try:
                    news_data = json.loads(content)
                    return news_data
                except json.JSONDecodeError:
                    # If response is not valid JSON, try to extract it
                    # Remove markdown code blocks if present
                    content = content.strip()
                    if content.startswith("```json"):
                        content = content[7:]
                    if content.startswith("```"):
                        content = content[3:]
                    if content.endswith("```"):
                        content = content[:-3]

                    news_data = json.loads(content.strip())
                    return news_data

            elif response.status_code == 401:
                raise ConnectionError("Invalid API key. Check your PPLX_API_KEY.")
            elif response.status_code == 429:
                raise ConnectionError("Rate limit exceeded. Please try again later.")
            else:
                raise ConnectionError(f"API Error {response.status_code}: {response.text}")

        except requests.exceptions.Timeout:
            raise ConnectionError("Request timeout. Perplexity API took too long to respond.")
        except requests.exceptions.RequestException as e:
            raise ConnectionError(f"Network error: {str(e)}")


def get_real_company_news(
    company_name: str,
    competitors: list[str] = None,
    num_news: int = 5,
    model: str = "sonar",
    api_key: Optional[str] = None
) -> list[dict]:
    """
    Convenience function to fetch company news using Perplexity API.

    Args:
        company_name: Name of the company
        competitors: List of competitor names
        num_news: Number of news items
        model: Perplexity model to use
        api_key: API key (optional, uses env var if not provided)

    Returns:
        List of news items
    """
    client = PerplexityClient(api_key=api_key)
    return client.get_company_news(
        company_name=company_name,
        competitors=competitors,
        num_news=num_news,
        model=model
    )
