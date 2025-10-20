FROM uhinf/webprogramming:2526

WORKDIR /website

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}
ENV PORT=3000

COPY package.json package-lock.json* /website/

RUN if [ "$NODE_ENV" = "production" ] ; then \
      npm install --production --no-audit --no-fund ; \
    else \
      npm install --no-audit --no-fund ; \
    fi

COPY . /website

RUN rm -f /website/public/default.html || true

EXPOSE ${PORT}

CMD ["node", "index.js"]
