exports.up = async (knex) => {
    await knex.raw(`
    BEGIN;
    
    INSERT INTO public."TicketCategoryClassifier" (dv, sender, "name", id, v, "createdAt", "updatedAt", "deletedAt", "newId", "createdBy", organization,  "updatedBy") VALUES (1, '{"dv": 1, "fingerprint": "initial_import"}', 'Доводчик', '1975f713-4f6e-4b38-97c2-0af88712e7e6', 1, '2021-07-22 00:00:00.000000', '2021-07-22 00:00:00.000000', null, null, null, null, null);
    INSERT INTO public."TicketProblemClassifier" (dv, sender, "name", id, v, "createdAt", "updatedAt", "deletedAt", "newId", "createdBy", organization,  "updatedBy") VALUES (1, '{"dv": 1, "fingerprint": "initial_import"}', 'Сломался доводчик', '2f4c64a1-aad8-4b1a-80d3-05921e60382f', 1, '2021-07-22 00:00:00.000000', '2021-07-22 00:00:00.000000', null, null, null, null, null);
    INSERT INTO public."TicketProblemClassifier" (dv, sender, "name", id, v, "createdAt", "updatedAt", "deletedAt", "newId", "createdBy", organization,  "updatedBy") VALUES (1, '{"dv": 1, "fingerprint": "initial_import"}', 'Установить доводчик', '86b82a68-c29d-4da4-b980-384f1c84826c', 1, '2021-07-22 00:00:00.000000', '2021-07-22 00:00:00.000000', null, null, null, null, null);
    INSERT INTO public."TicketClassifierRule" ("dv", "sender", "id", "v", "createdAt", "updatedAt", "deletedAt", "newId", "category", "createdBy", "place", "problem", "updatedBy") VALUES (1, '{"dv": 1, "fingerprint": "initial_import"}', '1373142b-c94d-4eef-8aeb-1f44972959d0', 1, '2021-07-22 00:00:00.000000', '2021-07-22 00:00:00.000000', null, null, '1975f713-4f6e-4b38-97c2-0af88712e7e6', null, 'a56153a2-d797-4822-ba95-392b69ee0fa6', '2f4c64a1-aad8-4b1a-80d3-05921e60382f', null);
    INSERT INTO public."TicketClassifierRule" ("dv", "sender", "id", "v", "createdAt", "updatedAt", "deletedAt", "newId", "category", "createdBy", "place", "problem", "updatedBy") VALUES (1, '{"dv": 1, "fingerprint": "initial_import"}', '76066a74-fda5-41c3-8b8c-7b07eec09fec', 1, '2021-07-22 00:00:00.000000', '2021-07-22 00:00:00.000000', null, null, '1975f713-4f6e-4b38-97c2-0af88712e7e6', null, 'a56153a2-d797-4822-ba95-392b69ee0fa6', '86b82a68-c29d-4da4-b980-384f1c84826c', null);
    INSERT INTO public."TicketClassifierRule" ("dv", "sender", "id", "v", "createdAt", "updatedAt", "deletedAt", "newId", "category", "createdBy", "place", "problem", "updatedBy") VALUES (1, '{"dv": 1, "fingerprint": "initial_import"}', '01c52e55-61c0-478e-9adb-c86c8402b7f7', 1, '2021-07-22 00:00:00.000000', '2021-07-22 00:00:00.000000', null, null, '1975f713-4f6e-4b38-97c2-0af88712e7e6', null, 'c08725fc-3714-4d9c-a274-2d297f8e1163', '2f4c64a1-aad8-4b1a-80d3-05921e60382f', null);
    INSERT INTO public."TicketClassifierRule" ("dv", "sender", "id", "v", "createdAt", "updatedAt", "deletedAt", "newId", "category", "createdBy", "place", "problem", "updatedBy") VALUES (1, '{"dv": 1, "fingerprint": "initial_import"}', '70cbd63a-c40a-4c22-aa0b-23a6cdf5d499', 1, '2021-07-22 00:00:00.000000', '2021-07-22 00:00:00.000000', null, null, '1975f713-4f6e-4b38-97c2-0af88712e7e6', null, 'c08725fc-3714-4d9c-a274-2d297f8e1163', '86b82a68-c29d-4da4-b980-384f1c84826c', null);
    INSERT INTO public."TicketClassifierRule" ("dv", "sender", "id", "v", "createdAt", "updatedAt", "deletedAt", "newId", "category", "createdBy", "place", "problem", "updatedBy") VALUES (1, '{"dv": 1, "fingerprint": "initial_import"}', '4ff27c3f-9d28-4618-a978-10c36b362a11', 1, '2021-07-22 00:00:00.000000', '2021-07-22 00:00:00.000000', null, null, '1975f713-4f6e-4b38-97c2-0af88712e7e6', null, '067883f5-baa3-48c1-aca7-47213405fb28', '2f4c64a1-aad8-4b1a-80d3-05921e60382f', null);
    INSERT INTO public."TicketClassifierRule" ("dv", "sender", "id", "v", "createdAt", "updatedAt", "deletedAt", "newId", "category", "createdBy", "place", "problem", "updatedBy") VALUES (1, '{"dv": 1, "fingerprint": "initial_import"}', '071dcd59-460d-4c7d-9463-5fdb940d5df3', 1, '2021-07-22 00:00:00.000000', '2021-07-22 00:00:00.000000', null, null, '1975f713-4f6e-4b38-97c2-0af88712e7e6', null, '067883f5-baa3-48c1-aca7-47213405fb28', '86b82a68-c29d-4da4-b980-384f1c84826c', null);
    INSERT INTO public."TicketClassifierRule" ("dv", "sender", "id", "v", "createdAt", "updatedAt", "deletedAt", "newId", "category", "createdBy", "place", "problem", "updatedBy") VALUES (1, '{"dv": 1, "fingerprint": "initial_import"}', '43de5ac5-6909-40d1-92c0-82a457dd28a8', 1, '2021-07-22 00:00:00.000000', '2021-07-22 00:00:00.000000', null, null, '1975f713-4f6e-4b38-97c2-0af88712e7e6', null, 'd1ab29e5-3193-49be-9a91-20a37df477f8', '2f4c64a1-aad8-4b1a-80d3-05921e60382f', null);
    INSERT INTO public."TicketClassifierRule" ("dv", "sender", "id", "v", "createdAt", "updatedAt", "deletedAt", "newId", "category", "createdBy", "place", "problem", "updatedBy") VALUES (1, '{"dv": 1, "fingerprint": "initial_import"}', '52670064-a290-4c68-b195-5fb56698e356', 1, '2021-07-22 00:00:00.000000', '2021-07-22 00:00:00.000000', null, null, '1975f713-4f6e-4b38-97c2-0af88712e7e6', null, 'd1ab29e5-3193-49be-9a91-20a37df477f8', '86b82a68-c29d-4da4-b980-384f1c84826c', null);
    INSERT INTO public."TicketClassifierRule" ("dv", "sender", "id", "v", "createdAt", "updatedAt", "deletedAt", "newId", "category", "createdBy", "place", "problem", "updatedBy") VALUES (1, '{"dv": 1, "fingerprint": "initial_import"}', 'beef687e-401c-46ed-8738-d58f645801c8', 1, '2021-07-22 00:00:00.000000', '2021-07-22 00:00:00.000000', null, null, '1975f713-4f6e-4b38-97c2-0af88712e7e6', null, 'a56153a2-d797-4822-ba95-392b69ee0fa6', null, null);
    INSERT INTO public."TicketClassifierRule" ("dv", "sender", "id", "v", "createdAt", "updatedAt", "deletedAt", "newId", "category", "createdBy", "place", "problem", "updatedBy") VALUES (1, '{"dv": 1, "fingerprint": "initial_import"}', 'd689a2e1-8153-447a-a13a-8caabc78663f', 1, '2021-07-22 00:00:00.000000', '2021-07-22 00:00:00.000000', null, null, '1975f713-4f6e-4b38-97c2-0af88712e7e6', null, 'c08725fc-3714-4d9c-a274-2d297f8e1163', null, null);
    INSERT INTO public."TicketClassifierRule" ("dv", "sender", "id", "v", "createdAt", "updatedAt", "deletedAt", "newId", "category", "createdBy", "place", "problem", "updatedBy") VALUES (1, '{"dv": 1, "fingerprint": "initial_import"}', 'cdb6afb9-76d2-4b57-96ed-45bc9037ecb2', 1, '2021-07-22 00:00:00.000000', '2021-07-22 00:00:00.000000', null, null, '1975f713-4f6e-4b38-97c2-0af88712e7e6', null, '067883f5-baa3-48c1-aca7-47213405fb28', null, null);
    INSERT INTO public."TicketClassifierRule" ("dv", "sender", "id", "v", "createdAt", "updatedAt", "deletedAt", "newId", "category", "createdBy", "place", "problem", "updatedBy") VALUES (1, '{"dv": 1, "fingerprint": "initial_import"}', 'a6016fbb-a38d-4070-84bf-e739d2077363', 1, '2021-07-22 00:00:00.000000', '2021-07-22 00:00:00.000000', null, null, '1975f713-4f6e-4b38-97c2-0af88712e7e6', null, 'd1ab29e5-3193-49be-9a91-20a37df477f8', null, null);
    
    COMMIT;
    `)
}

exports.down = async (knex) => {
    await knex.raw(`
    BEGIN;
    
    DELETE FROM public."TicketCategoryClassifier" WHERE "id" = '1975f713-4f6e-4b38-97c2-0af88712e7e6'; 
    DELETE FROM public."TicketProblemClassifier" WHERE "id" = '2f4c64a1-aad8-4b1a-80d3-05921e60382f';
    DELETE FROM public."TicketProblemClassifier" WHERE "id" = '86b82a68-c29d-4da4-b980-384f1c84826c';
    DELETE FROM public."TicketClassifierRule" WHERE "id" = '1373142b-c94d-4eef-8aeb-1f44972959d0';
    DELETE FROM public."TicketClassifierRule" WHERE "id" = '76066a74-fda5-41c3-8b8c-7b07eec09fec';
    DELETE FROM public."TicketClassifierRule" WHERE "id" = '01c52e55-61c0-478e-9adb-c86c8402b7f7';
    DELETE FROM public."TicketClassifierRule" WHERE "id" = '70cbd63a-c40a-4c22-aa0b-23a6cdf5d499';
    DELETE FROM public."TicketClassifierRule" WHERE "id" = '4ff27c3f-9d28-4618-a978-10c36b362a11';
    DELETE FROM public."TicketClassifierRule" WHERE "id" = '071dcd59-460d-4c7d-9463-5fdb940d5df3';
    DELETE FROM public."TicketClassifierRule" WHERE "id" = '43de5ac5-6909-40d1-92c0-82a457dd28a8';
    DELETE FROM public."TicketClassifierRule" WHERE "id" = '52670064-a290-4c68-b195-5fb56698e356';
    DELETE FROM public."TicketClassifierRule" WHERE "id" = 'beef687e-401c-46ed-8738-d58f645801c8';
    DELETE FROM public."TicketClassifierRule" WHERE "id" = 'd689a2e1-8153-447a-a13a-8caabc78663f';
    DELETE FROM public."TicketClassifierRule" WHERE "id" = 'cdb6afb9-76d2-4b57-96ed-45bc9037ecb2';
    DELETE FROM public."TicketClassifierRule" WHERE "id" = 'a6016fbb-a38d-4070-84bf-e739d2077363';
    
    COMMIT;
    `)
}
