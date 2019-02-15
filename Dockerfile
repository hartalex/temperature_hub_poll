FROM node:11.9.0-alpine
ENV NODE_ENV production
RUN mkdir /root/temperature_hub_poll
COPY ./build /root/temperature_hub_poll/
COPY ./package.json /root/temperature_hub_poll/package.json
COPY ./start.sh /root/temperature_hub_poll/start.sh
COPY ./config.js /root/temperature_hub_poll/config.js
WORKDIR /root/temperature_hub_poll
RUN echo "* * * * *  node /root/temperature_hub_poll/main.js " >> /etc/crontabs/root
RUN yarn install
ENTRYPOINT ["/root/temperature_hub_poll/start.sh"]
