FROM denoland/deno
RUN apt-get update && apt-get install -y git
EXPOSE 8000
USER deno
WORKDIR /app
COPY . .
RUN deno cache src/webhook.ts
CMD ["run", "--allow-net", "--allow-env", "--allow-run", "--allow-sys", "src/webhook.ts"]
