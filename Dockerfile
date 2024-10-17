FROM denoland/deno:alpine-1.46.3

WORKDIR /app
ADD deno.json deno.lock ./
RUN deno cache --unstable --lock=deno.lock deno.json

COPY ./src ./src
RUN deno task cache

ENTRYPOINT [ "deno", "task", "start" ]