FROM gitea/test_env:linux-1.20-amd64
RUN apt-get install unzip -y
ENV DENO_INSTALL=/usr/local
RUN curl -fsSL https://deno.land/x/install/install.sh | sh
EXPOSE 8000
WORKDIR /app
COPY src .
RUN deno cache webhook.ts
ENTRYPOINT ["deno"]
CMD ["run", "--allow-net", "--allow-env", "--allow-run", "webhook.ts"]