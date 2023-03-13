FROM denoland/deno:alpine
RUN apk add --no-cache git
EXPOSE 8000
USER deno
WORKDIR /app
COPY src .
RUN deno cache webhook.ts
CMD ["run", "--allow-net", "--allow-env", "--allow-run", "webhook.ts"]